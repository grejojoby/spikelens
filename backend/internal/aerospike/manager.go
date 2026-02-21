package aerospike

import (
	"fmt"
	"sync"
	"time"

	as "github.com/aerospike/aerospike-client-go/v7"
	"github.com/grejo-j/spikelens/backend/internal/models"
)

// Manager manages multiple Aerospike client connections
type Manager struct {
	mu      sync.RWMutex
	clients map[string]*as.Client
}

// NewManager creates a new connection manager
func NewManager() *Manager {
	return &Manager{
		clients: make(map[string]*as.Client),
	}
}

// Connect establishes a connection to an Aerospike cluster
func (m *Manager) Connect(profile *models.ConnectionProfile) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	if c, ok := m.clients[profile.ID]; ok {
		c.Close()
		delete(m.clients, profile.ID)
	}

	policy := as.NewClientPolicy()
	policy.Timeout = 5 * time.Second
	if profile.User != "" {
		policy.User = profile.User
		policy.Password = profile.Password
	}

	client, err := as.NewClientWithPolicy(policy, profile.Host, profile.Port)
	if err != nil {
		return fmt.Errorf("connect to aerospike: %w", err)
	}
	m.clients[profile.ID] = client
	return nil
}

// Disconnect closes a connection
func (m *Manager) Disconnect(id string) {
	m.mu.Lock()
	defer m.mu.Unlock()
	if c, ok := m.clients[id]; ok {
		c.Close()
		delete(m.clients, id)
	}
}

// Get returns a client for the given profile ID
func (m *Manager) Get(id string) (*as.Client, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	c, ok := m.clients[id]
	if !ok {
		return nil, fmt.Errorf("not connected: %s", id)
	}
	if !c.IsConnected() {
		return nil, fmt.Errorf("connection lost: %s", id)
	}
	return c, nil
}

// TestConnection tests connectivity without persisting the client
func (m *Manager) TestConnection(profile *models.ConnectionProfile) (int64, error) {
	policy := as.NewClientPolicy()
	policy.Timeout = 5 * time.Second
	if profile.User != "" {
		policy.User = profile.User
		policy.Password = profile.Password
	}

	start := time.Now()
	client, err := as.NewClientWithPolicy(policy, profile.Host, profile.Port)
	if err != nil {
		return 0, fmt.Errorf("connection failed: %w", err)
	}
	defer client.Close()
	return time.Since(start).Milliseconds(), nil
}

// CloseAll disconnects all clients
func (m *Manager) CloseAll() {
	m.mu.Lock()
	defer m.mu.Unlock()
	for id, c := range m.clients {
		c.Close()
		delete(m.clients, id)
	}
}
