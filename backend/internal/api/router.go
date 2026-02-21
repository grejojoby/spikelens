package api

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	aeroManager "github.com/grejo-j/spikelens/backend/internal/aerospike"
	"github.com/grejo-j/spikelens/backend/internal/store"
	"github.com/grejo-j/spikelens/backend/internal/ws"
)

// Handler holds all dependencies for API handlers
type Handler struct {
	store   *store.Store
	manager *aeroManager.Manager
	hub     *ws.Hub
}

// NewRouter builds the chi router with all routes and middleware
func NewRouter(s *store.Store, m *aeroManager.Manager, h *ws.Hub) http.Handler {
	handler := &Handler{store: s, manager: m, hub: h}

	r := chi.NewRouter()
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(corsMiddleware)

	// Health check
	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte(`{"status":"ok"}`))
	})

	// WebSocket stats
	r.Get("/ws/stats", h.ServeWS)

	r.Route("/api", func(r chi.Router) {
		// Connections
		r.Get("/connections", handler.ListConnections)
		r.Post("/connections", handler.CreateConnection)
		r.Put("/connections/{id}", handler.UpdateConnection)
		r.Delete("/connections/{id}", handler.DeleteConnection)
		r.Post("/connections/{id}/test", handler.TestConnection)
		r.Post("/connections/{id}/activate", handler.ActivateConnection)

		// Namespaces & Sets (require active connection)
		r.Get("/namespaces", handler.ListNamespaces)
		r.Get("/namespaces/{ns}/sets", handler.ListSets)
		r.Get("/namespaces/{ns}/sets/{set}/records", handler.ScanRecords)

		// Records
		r.Get("/namespaces/{ns}/sets/{set}/records/{key}", handler.GetRecord)
		r.Put("/namespaces/{ns}/sets/{set}/records/{key}", handler.UpdateRecord)
		r.Delete("/namespaces/{ns}/sets/{set}/records/{key}", handler.DeleteRecord)
		r.Post("/namespaces/{ns}/sets/{set}/records", handler.CreateRecord)

		// Query & Scan
		r.Post("/query", handler.ExecuteQuery)
		r.Post("/scan", handler.ExecuteScan)

		// Cluster
		r.Get("/cluster/info", handler.ClusterInfo)
		r.Get("/cluster/stats", handler.ClusterStats)

		// Indexes
		r.Get("/indexes", handler.ListIndexes)
		r.Post("/indexes", handler.CreateIndex)
		r.Delete("/indexes/{namespace}/{name}", handler.DropIndex)

		// AQL
		r.Post("/aql/execute", handler.ExecuteAQL)
	})

	return r
}

func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type,Authorization")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}
