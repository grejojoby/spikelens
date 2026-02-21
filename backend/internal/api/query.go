package api

import (
	"encoding/json"
	"net/http"

	as "github.com/aerospike/aerospike-client-go/v7"
	"github.com/grejo-j/spikelens/backend/internal/models"
)

// ExecuteQuery POST /api/query — secondary index query
func (h *Handler) ExecuteQuery(w http.ResponseWriter, r *http.Request) {
	var req models.QueryRequest
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

	stmt := as.NewStatement(req.Namespace, req.Set)
	if len(req.BinNames) > 0 {
		stmt.BinNames = req.BinNames
	}

	qp := as.NewQueryPolicy()
	if req.Limit > 0 {
		qp.MaxRecords = int64(req.Limit)
	}

	// Apply first filter (Aerospike supports one filter per query)
	if len(req.Filters) > 0 {
		f := req.Filters[0]
		switch f.Op {
		case "eq":
			switch v := f.Value.(type) {
			case float64:
				stmt.SetFilter(as.NewEqualFilter(f.Bin, int64(v)))
			case string:
				stmt.SetFilter(as.NewEqualFilter(f.Bin, v))
			}
		case "range":
			if arr, ok := f.Value.([]any); ok && len(arr) == 2 {
				lo, _ := toFloat64(arr[0])
				hi, _ := toFloat64(arr[1])
				stmt.SetFilter(as.NewRangeFilter(f.Bin, int64(lo), int64(hi)))
			}
		}
	}

	rs, err := client.Query(qp, stmt)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	defer rs.Close()

	records := []models.RecordResponse{}
	for res := range rs.Results() {
		if res.Err != nil {
			continue
		}
		records = append(records, toRecordResponse(res.Record))
	}
	writeJSON(w, http.StatusOK, records)
}

// ExecuteScan POST /api/scan — full namespace/set scan
func (h *Handler) ExecuteScan(w http.ResponseWriter, r *http.Request) {
	var req models.ScanRequest
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

	sp := as.NewScanPolicy()
	if req.Limit > 0 {
		sp.MaxRecords = int64(req.Limit)
	}

	rs, err := client.ScanAll(sp, req.Namespace, req.Set, req.BinNames...)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	defer rs.Close()

	records := []models.RecordResponse{}
	for res := range rs.Results() {
		if res.Err != nil {
			continue
		}
		records = append(records, toRecordResponse(res.Record))
	}
	writeJSON(w, http.StatusOK, records)
}

func toFloat64(v any) (float64, bool) {
	switch n := v.(type) {
	case float64:
		return n, true
	case int64:
		return float64(n), true
	case int:
		return float64(n), true
	}
	return 0, false
}
