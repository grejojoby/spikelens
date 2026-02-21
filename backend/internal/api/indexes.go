package api

import (
	"encoding/json"
	"net/http"
	"strings"

	as "github.com/aerospike/aerospike-client-go/v7"
	"github.com/go-chi/chi/v5"
	"github.com/grejo-j/spikelens/backend/internal/models"
)

// ListIndexes GET /api/indexes
func (h *Handler) ListIndexes(w http.ResponseWriter, r *http.Request) {
	connID, ok := h.activeClient(w, r)
	if !ok {
		return
	}
	client, err := h.manager.Get(connID)
	if err != nil {
		writeError(w, http.StatusServiceUnavailable, err.Error())
		return
	}

	nodes := client.GetNodes()
	if len(nodes) == 0 {
		writeError(w, http.StatusServiceUnavailable, "no nodes available")
		return
	}
	info, err := nodes[0].RequestInfo(as.NewInfoPolicy(), "sindex")
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	indexes := parseSindexInfo(info["sindex"])
	writeJSON(w, http.StatusOK, indexes)
}

// CreateIndex POST /api/indexes
func (h *Handler) CreateIndex(w http.ResponseWriter, r *http.Request) {
	var req models.CreateIndexRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
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

	var indexType as.IndexType
	switch strings.ToUpper(req.Type) {
	case "NUMERIC":
		indexType = as.NUMERIC
	case "STRING":
		indexType = as.STRING
	case "GEO2DSPHERE":
		indexType = as.GEO2DSPHERE
	default:
		writeError(w, http.StatusBadRequest, "unsupported index type; use NUMERIC, STRING, or GEO2DSPHERE")
		return
	}

	task, err := client.CreateIndex(as.NewWritePolicy(0, 0), req.Namespace, req.Set, req.Name, req.BinName, indexType)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	if err := <-task.OnComplete(); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeJSON(w, http.StatusCreated, models.SecondaryIndex{
		Namespace: req.Namespace,
		Set:       req.Set,
		Name:      req.Name,
		BinName:   req.BinName,
		Type:      req.Type,
		State:     "READY",
	})
}

// DropIndex DELETE /api/indexes/:namespace/:name
func (h *Handler) DropIndex(w http.ResponseWriter, r *http.Request) {
	namespace := chi.URLParam(r, "namespace")
	name := chi.URLParam(r, "name")

	connID, ok := h.activeClient(w, r)
	if !ok {
		return
	}
	client, err := h.manager.Get(connID)
	if err != nil {
		writeError(w, http.StatusServiceUnavailable, err.Error())
		return
	}

	if err := client.DropIndex(as.NewWritePolicy(0, 0), namespace, "", name); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func parseSindexInfo(raw string) []models.SecondaryIndex {
	indexes := []models.SecondaryIndex{}
	for _, entry := range strings.Split(raw, ";") {
		entry = strings.TrimSpace(entry)
		if entry == "" {
			continue
		}
		idx := models.SecondaryIndex{}
		for _, part := range strings.Split(entry, ":") {
			kv := strings.SplitN(part, "=", 2)
			if len(kv) != 2 {
				continue
			}
			switch kv[0] {
			case "ns":
				idx.Namespace = kv[1]
			case "set":
				idx.Set = kv[1]
			case "indexname":
				idx.Name = kv[1]
			case "bin":
				idx.BinName = kv[1]
			case "type":
				idx.Type = strings.ToUpper(kv[1])
			case "state":
				idx.State = kv[1]
			}
		}
		if idx.Name != "" {
			indexes = append(indexes, idx)
		}
	}
	return indexes
}
