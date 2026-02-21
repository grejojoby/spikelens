package api

import (
	"net/http"
	"strconv"
	"strings"

	as "github.com/aerospike/aerospike-client-go/v7"
	"github.com/go-chi/chi/v5"
	"github.com/grejo-j/spikelens/backend/internal/models"
)

// ListNamespaces GET /api/namespaces
func (h *Handler) ListNamespaces(w http.ResponseWriter, r *http.Request) {
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
	info, err := nodes[0].RequestInfo(as.NewInfoPolicy(), "namespaces")
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	nsRaw := info["namespaces"]
	namespaces := []models.NamespaceInfo{}
	if nsRaw != "" {
		for _, ns := range strings.Split(nsRaw, ";") {
			ns = strings.TrimSpace(ns)
			if ns == "" {
				continue
			}
			namespaces = append(namespaces, models.NamespaceInfo{Name: ns})
		}
	}
	writeJSON(w, http.StatusOK, namespaces)
}

// ListSets GET /api/namespaces/:ns/sets
func (h *Handler) ListSets(w http.ResponseWriter, r *http.Request) {
	ns := chi.URLParam(r, "ns")
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
	infoKey := "sets/" + ns
	info, err := nodes[0].RequestInfo(as.NewInfoPolicy(), infoKey)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	sets := parseSetsInfo(ns, info[infoKey])
	writeJSON(w, http.StatusOK, sets)
}

// ScanRecords GET /api/namespaces/:ns/sets/:set/records
func (h *Handler) ScanRecords(w http.ResponseWriter, r *http.Request) {
	ns := chi.URLParam(r, "ns")
	set := chi.URLParam(r, "set")
	connID, ok := h.activeClient(w, r)
	if !ok {
		return
	}
	client, err := h.manager.Get(connID)
	if err != nil {
		writeError(w, http.StatusServiceUnavailable, err.Error())
		return
	}

	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	if limit <= 0 || limit > 500 {
		limit = 50
	}
	if page < 1 {
		page = 1
	}

	sp := as.NewScanPolicy()
	sp.SendKey = true                   // request server to return stored user key
	sp.MaxRecords = int64(limit * page) // over-scan to support simple pagination

	rs, err := client.ScanAll(sp, ns, set)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	defer rs.Close()

	allRecords := []models.RecordResponse{}
	for res := range rs.Results() {
		if res.Err != nil {
			continue
		}
		allRecords = append(allRecords, toRecordResponse(res.Record))
	}

	start := (page - 1) * limit
	end := start + limit
	if start > len(allRecords) {
		start = len(allRecords)
	}
	if end > len(allRecords) {
		end = len(allRecords)
	}

	paged := models.PagedRecords{
		Records: allRecords[start:end],
		Total:   len(allRecords),
		Page:    page,
		Limit:   limit,
		HasMore: end < len(allRecords),
	}
	writeJSON(w, http.StatusOK, paged)
}

func parseSetsInfo(ns, raw string) []models.SetInfo {
	sets := []models.SetInfo{}
	if raw == "" {
		return sets
	}
	for _, entry := range strings.Split(raw, ";") {
		entry = strings.TrimSpace(entry)
		if entry == "" {
			continue
		}
		si := models.SetInfo{Namespace: ns}
		for _, part := range strings.Split(entry, ":") {
			kv := strings.SplitN(part, "=", 2)
			if len(kv) != 2 {
				continue
			}
			switch kv[0] {
			case "set_name", "set":
				si.Name = kv[1]
			case "objects", "n_objects":
				si.RecordCount, _ = strconv.ParseInt(kv[1], 10, 64)
			case "memory_data_bytes":
				si.MemoryBytes, _ = strconv.ParseInt(kv[1], 10, 64)
			}
		}
		if si.Name != "" {
			sets = append(sets, si)
		}
	}
	return sets
}

func toRecordResponse(r *as.Record) models.RecordResponse {
	keyStr := ""
	if r.Key != nil {
		if uv := r.Key.Value(); uv != nil {
			keyStr = uv.String()
		}
	}
	return models.RecordResponse{
		Key:        keyStr,
		Generation: r.Generation,
		Expiry:     r.Expiration,
		Bins:       r.Bins,
	}
}
