package api

import (
	"encoding/json"
	"net/http"

	"github.com/grejo-j/spikelens/backend/internal/aql"
)

// ExecuteAQL POST /api/aql/execute
func (h *Handler) ExecuteAQL(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Statement string `json:"statement"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if req.Statement == "" {
		writeError(w, http.StatusBadRequest, "statement is required")
		return
	}

	connID, ok := h.activeClient(w, r)
	if !ok {
		return
	}
	client, err := h.manager.Get(connID)
	if err != nil {
		writeError(w, http.StatusServiceUnavailable, err.Error())
		return
	}

	executor := aql.NewExecutor(client)
	result := executor.Execute(req.Statement)
	writeJSON(w, http.StatusOK, result)
}
