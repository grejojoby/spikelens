package api

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/grejo-j/spikelens/backend/internal/models"
)

// ListConnections GET /api/connections
func (h *Handler) ListConnections(w http.ResponseWriter, r *http.Request) {
	profiles := h.store.List()
	if profiles == nil {
		profiles = []*models.ConnectionProfile{}
	}
	writeJSON(w, http.StatusOK, profiles)
}

// CreateConnection POST /api/connections
func (h *Handler) CreateConnection(w http.ResponseWriter, r *http.Request) {
	var profile models.ConnectionProfile
	if err := json.NewDecoder(r.Body).Decode(&profile); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if profile.Host == "" || profile.Port == 0 {
		writeError(w, http.StatusBadRequest, "host and port are required")
		return
	}
	if err := h.store.Add(&profile); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusCreated, profile)
}

// UpdateConnection PUT /api/connections/:id
func (h *Handler) UpdateConnection(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var profile models.ConnectionProfile
	if err := json.NewDecoder(r.Body).Decode(&profile); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if err := h.store.Update(id, &profile); err != nil {
		writeError(w, http.StatusNotFound, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, profile)
}

// DeleteConnection DELETE /api/connections/:id
func (h *Handler) DeleteConnection(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	h.manager.Disconnect(id)
	if err := h.store.Delete(id); err != nil {
		writeError(w, http.StatusNotFound, err.Error())
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// TestConnection POST /api/connections/:id/test
func (h *Handler) TestConnection(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	profile, ok := h.store.Get(id)
	if !ok {
		writeError(w, http.StatusNotFound, "connection not found")
		return
	}
	latency, err := h.manager.TestConnection(profile)
	if err != nil {
		writeJSON(w, http.StatusOK, models.TestConnectionResult{
			Success: false,
			Message: err.Error(),
		})
		return
	}
	writeJSON(w, http.StatusOK, models.TestConnectionResult{
		Success: true,
		Message: "Connected successfully",
		Latency: latency,
	})
}

// ActivateConnection POST /api/connections/:id/activate
func (h *Handler) ActivateConnection(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	profile, ok := h.store.Get(id)
	if !ok {
		writeError(w, http.StatusNotFound, "connection not found")
		return
	}
	// Connect the client
	if err := h.manager.Connect(profile); err != nil {
		writeError(w, http.StatusBadGateway, "failed to connect: "+err.Error())
		return
	}
	if err := h.store.SetActive(id); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	profile.Active = true
	writeJSON(w, http.StatusOK, profile)
}
