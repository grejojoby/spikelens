package api

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	as "github.com/aerospike/aerospike-client-go/v7"
	"github.com/grejo-j/spikelens/backend/internal/models"
)

// GetRecord GET /api/namespaces/:ns/sets/:set/records/:key
func (h *Handler) GetRecord(w http.ResponseWriter, r *http.Request) {
	ns := chi.URLParam(r, "ns")
	set := chi.URLParam(r, "set")
	key := chi.URLParam(r, "key")

	connID, ok := h.activeClient(w, r)
	if !ok {
		return
	}
	client, err := h.manager.Get(connID)
	if err != nil {
		writeError(w, http.StatusServiceUnavailable, err.Error())
		return
	}

	asKey, err := as.NewKey(ns, set, key)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	rp := as.NewPolicy()
	rp.SendKey = true
	rec, err := client.Get(rp, asKey)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	if rec == nil {
		writeError(w, http.StatusNotFound, "record not found")
		return
	}
	writeJSON(w, http.StatusOK, toRecordResponse(rec))
}

// CreateRecord POST /api/namespaces/:ns/sets/:set/records
func (h *Handler) CreateRecord(w http.ResponseWriter, r *http.Request) {
	ns := chi.URLParam(r, "ns")
	set := chi.URLParam(r, "set")

	var req struct {
		Key  string         `json:"key"`
		Bins map[string]any `json:"bins"`
		TTL  int            `json:"ttl"`
	}
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

	asKey, err := as.NewKey(ns, set, req.Key)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	wp := as.NewWritePolicy(0, uint32(req.TTL))
	bins := mapToBins(req.Bins)
	if err := client.PutBins(wp, asKey, bins...); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusCreated, models.RecordResponse{Key: req.Key, Bins: req.Bins})
}

// UpdateRecord PUT /api/namespaces/:ns/sets/:set/records/:key
func (h *Handler) UpdateRecord(w http.ResponseWriter, r *http.Request) {
	ns := chi.URLParam(r, "ns")
	set := chi.URLParam(r, "set")
	key := chi.URLParam(r, "key")

	var req models.RecordRequest
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

	asKey, err := as.NewKey(ns, set, key)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	wp := as.NewWritePolicy(0, uint32(req.TTL))
	bins := mapToBins(req.Bins)
	if err := client.PutBins(wp, asKey, bins...); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, models.RecordResponse{Key: key, Bins: req.Bins})
}

// DeleteRecord DELETE /api/namespaces/:ns/sets/:set/records/:key
func (h *Handler) DeleteRecord(w http.ResponseWriter, r *http.Request) {
	ns := chi.URLParam(r, "ns")
	set := chi.URLParam(r, "set")
	key := chi.URLParam(r, "key")

	connID, ok := h.activeClient(w, r)
	if !ok {
		return
	}
	client, err := h.manager.Get(connID)
	if err != nil {
		writeError(w, http.StatusServiceUnavailable, err.Error())
		return
	}

	asKey, err := as.NewKey(ns, set, key)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	existed, err := client.Delete(as.NewWritePolicy(0, 0), asKey)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	if !existed {
		writeError(w, http.StatusNotFound, "record not found")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func mapToBins(m map[string]any) []*as.Bin {
	bins := make([]*as.Bin, 0, len(m))
	for k, v := range m {
		bins = append(bins, as.NewBin(k, v))
	}
	return bins
}
