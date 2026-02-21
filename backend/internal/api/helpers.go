package api

import (
	"encoding/json"
	"net/http"

	"github.com/grejo-j/spikelens/backend/internal/models"
)

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}

func writeError(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, models.ErrorResponse{Error: msg})
}

func (h *Handler) activeClient(w http.ResponseWriter, r *http.Request) (string, bool) {
	profiles := h.store.List()
	for _, p := range profiles {
		if p.Active {
			_, err := h.manager.Get(p.ID)
			if err != nil {
				// Try reconnecting
				if connErr := h.manager.Connect(p); connErr != nil {
					writeError(w, http.StatusServiceUnavailable, "active connection unavailable: "+connErr.Error())
					return "", false
				}
			}
			return p.ID, true
		}
	}
	writeError(w, http.StatusBadRequest, "no active connection; please activate a connection first")
	return "", false
}
