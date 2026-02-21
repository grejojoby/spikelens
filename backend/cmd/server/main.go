package main

import (
	"context"
	"flag"
	"log"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"syscall"
	"time"

	aeroManager "github.com/grejo-j/spikelens/backend/internal/aerospike"
	"github.com/grejo-j/spikelens/backend/internal/api"
	"github.com/grejo-j/spikelens/backend/internal/store"
	"github.com/grejo-j/spikelens/backend/internal/ws"
)

func main() {
	addr := flag.String("addr", ":7777", "HTTP server address")
	dataDir := flag.String("data", defaultDataDir(), "Data directory for persistent storage")
	flag.Parse()

	// Persistent connection store
	s, err := store.New(*dataDir)
	if err != nil {
		log.Fatalf("init store: %v", err)
	}

	// Aerospike connection manager
	manager := aeroManager.NewManager()
	defer manager.CloseAll()

	// Auto-reconnect any connection that was active in the previous session.
	// The manager is in-memory only, so every backend restart loses live clients.
	for _, p := range s.List() {
		if !p.Active {
			continue
		}
		if err := manager.Connect(p); err != nil {
			log.Printf("warn: auto-reconnect %q (%s:%d) failed: %v", p.Name, p.Host, p.Port, err)
		} else {
			log.Printf("Auto-reconnected: %q (%s:%d)", p.Name, p.Host, p.Port)
		}
	}

	// WebSocket hub
	hub := ws.NewHub()
	go hub.Run()

	// HTTP router
	router := api.NewRouter(s, manager, hub)

	// Broadcast cluster stats every second when there is an active connection
	go func() {
		ticker := time.NewTicker(1 * time.Second)
		defer ticker.Stop()
		for range ticker.C {
			profiles := s.List()
			for _, p := range profiles {
				if !p.Active {
					continue
				}
				client, err := manager.Get(p.ID)
				if err != nil {
					continue
				}
				_ = client // stats fetched via RequestInfo inside hub broadcast
				hub.Broadcast(map[string]string{"type": "ping", "ts": time.Now().Format(time.RFC3339)})
			}
		}
	}()

	srv := &http.Server{
		Addr:    *addr,
		Handler: router,
	}

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		log.Printf("SpikeLens backend listening on %s", *addr)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("server error: %v", err)
		}
	}()

	<-quit
	log.Println("Shutting down...")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	srv.Shutdown(ctx)
}

func defaultDataDir() string {
	home, err := os.UserHomeDir()
	if err != nil {
		return filepath.Join(os.TempDir(), "spikelens")
	}
	return filepath.Join(home, ".spikelens")
}
