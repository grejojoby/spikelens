package api

import (
	"fmt"
	"net/http"
	"strings"

	as "github.com/aerospike/aerospike-client-go/v7"
	"github.com/grejo-j/spikelens/backend/internal/models"
)

// ClusterInfo GET /api/cluster/info
func (h *Handler) ClusterInfo(w http.ResponseWriter, r *http.Request) {
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
	nodeStats := make([]models.NodeStat, 0, len(nodes))
	for _, node := range nodes {
		host := node.GetHost()
		nodeStats = append(nodeStats, models.NodeStat{
			Name:    node.GetName(),
			Address: fmt.Sprintf("%s:%d", host.Name, host.Port),
			Active:  node.IsActive(),
			Stats:   map[string]string{},
		})
	}
	writeJSON(w, http.StatusOK, models.ClusterInfo{
		Nodes:     nodeStats,
		NodeCount: len(nodeStats),
	})
}

// ClusterStats GET /api/cluster/stats
func (h *Handler) ClusterStats(w http.ResponseWriter, r *http.Request) {
	connID, ok := h.activeClient(w, r)
	if !ok {
		return
	}
	client, err := h.manager.Get(connID)
	if err != nil {
		writeError(w, http.StatusServiceUnavailable, err.Error())
		return
	}

	stats := fetchNodeStats(client)
	writeJSON(w, http.StatusOK, stats)
}

func fetchNodeStats(client *as.Client) []models.NodeStat {
	nodes := client.GetNodes()
	result := make([]models.NodeStat, 0, len(nodes))
	policy := as.NewInfoPolicy()
	for _, node := range nodes {
		host := node.GetHost()
		info, err := node.RequestInfo(policy, "statistics")
		statsMap := map[string]string{}
		if err == nil {
			statsMap = parseStatistics(info["statistics"])
		}
		conns := 0
		if v, ok := statsMap["client_connections"]; ok {
			fmt.Sscanf(v, "%d", &conns)
		}
		result = append(result, models.NodeStat{
			Name:        node.GetName(),
			Address:     fmt.Sprintf("%s:%d", host.Name, host.Port),
			Active:      node.IsActive(),
			Connections: conns,
			Stats:       statsMap,
		})
	}
	return result
}

func parseStatistics(raw string) map[string]string {
	m := map[string]string{}
	for _, part := range strings.Split(raw, ";") {
		kv := strings.SplitN(part, "=", 2)
		if len(kv) == 2 {
			m[kv[0]] = kv[1]
		}
	}
	return m
}
