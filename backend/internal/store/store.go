package store

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"sync"

	"github.com/google/uuid"
	"github.com/grejo-j/spikelens/backend/internal/models"
)

// Store manages persistent connection profiles
type Store struct {
	mu       sync.RWMutex
	filePath string
	profiles map[string]*models.ConnectionProfile
}

// New creates a new Store backed by a JSON file
func New(dataDir string) (*Store, error) {
	if err := os.MkdirAll(dataDir, 0755); err != nil {
		return nil, fmt.Errorf("create data dir: %w", err)
	}
	s := &Store{
		filePath: filepath.Join(dataDir, "connections.json"),
		profiles: make(map[string]*models.ConnectionProfile),
	}
	if err := s.load(); err != nil {
		return nil, err
	}
	return s, nil
}

func (s *Store) load() error {
	data, err := os.ReadFile(s.filePath)
	if os.IsNotExist(err) {
		return nil
	}
	if err != nil {
		return fmt.Errorf("read store file: %w", err)
	}
	var profiles []*models.ConnectionProfile
	if err := json.Unmarshal(data, &profiles); err != nil {
		return fmt.Errorf("parse store file: %w", err)
	}
	for _, p := range profiles {
		s.profiles[p.ID] = p
	}
	return nil
}

func (s *Store) save() error {
	profiles := s.listUnsafe()
	data, err := json.MarshalIndent(profiles, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(s.filePath, data, 0644)
}

func (s *Store) listUnsafe() []*models.ConnectionProfile {
	result := make([]*models.ConnectionProfile, 0, len(s.profiles))
	for _, p := range s.profiles {
		result = append(result, p)
	}
	return result
}

// List returns all connection profiles
func (s *Store) List() []*models.ConnectionProfile {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.listUnsafe()
}

// Get returns a profile by ID
func (s *Store) Get(id string) (*models.ConnectionProfile, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	p, ok := s.profiles[id]
	return p, ok
}

// Add creates a new connection profile
func (s *Store) Add(profile *models.ConnectionProfile) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	profile.ID = uuid.New().String()
	s.profiles[profile.ID] = profile
	return s.save()
}

// Update modifies an existing profile
func (s *Store) Update(id string, profile *models.ConnectionProfile) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	if _, ok := s.profiles[id]; !ok {
		return fmt.Errorf("profile not found: %s", id)
	}
	profile.ID = id
	s.profiles[id] = profile
	return s.save()
}

// Delete removes a profile
func (s *Store) Delete(id string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	if _, ok := s.profiles[id]; !ok {
		return fmt.Errorf("profile not found: %s", id)
	}
	delete(s.profiles, id)
	return s.save()
}

// SetActive marks one connection as active and all others as inactive
func (s *Store) SetActive(id string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	if _, ok := s.profiles[id]; !ok {
		return fmt.Errorf("profile not found: %s", id)
	}
	for _, p := range s.profiles {
		p.Active = (p.ID == id)
	}
	return s.save()
}
