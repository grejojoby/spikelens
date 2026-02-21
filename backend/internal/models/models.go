package models

// ConnectionProfile represents a saved Aerospike connection
type ConnectionProfile struct {
	ID        string `json:"id"`
	Name      string `json:"name"`
	Host      string `json:"host"`
	Port      int    `json:"port"`
	User      string `json:"user,omitempty"`
	Password  string `json:"password,omitempty"`
	TLSEnable bool   `json:"tlsEnable"`
	Active    bool   `json:"active"`
}

// RecordResponse represents an Aerospike record
type RecordResponse struct {
	Key        string         `json:"key"`
	Generation uint32         `json:"generation"`
	Expiry     uint32         `json:"expiry"`
	Bins       map[string]any `json:"bins"`
}

// NamespaceInfo holds namespace metadata
type NamespaceInfo struct {
	Name     string    `json:"name"`
	Sets     []SetInfo `json:"sets,omitempty"`
	SetCount int       `json:"setCount"`
}

// SetInfo holds set metadata
type SetInfo struct {
	Name        string `json:"name"`
	Namespace   string `json:"namespace"`
	RecordCount int64  `json:"recordCount"`
	MemoryBytes int64  `json:"memoryBytes"`
}

// NodeStat represents statistics for a single cluster node
type NodeStat struct {
	Name        string            `json:"name"`
	Address     string            `json:"address"`
	Active      bool              `json:"active"`
	Connections int               `json:"connections"`
	Stats       map[string]string `json:"stats"`
}

// ClusterInfo represents overall cluster information
type ClusterInfo struct {
	Nodes     []NodeStat `json:"nodes"`
	NodeCount int        `json:"nodeCount"`
}

// SecondaryIndex represents an Aerospike secondary index
type SecondaryIndex struct {
	Namespace string `json:"namespace"`
	Set       string `json:"set"`
	Name      string `json:"name"`
	BinName   string `json:"binName"`
	Type      string `json:"type"` // NUMERIC, STRING, GEO2DSPHERE
	State     string `json:"state"`
}

// QueryRequest is the request body for a query
type QueryRequest struct {
	Namespace string        `json:"namespace"`
	Set       string        `json:"set"`
	IndexName string        `json:"indexName,omitempty"`
	Filters   []QueryFilter `json:"filters"`
	BinNames  []string      `json:"binNames,omitempty"`
	Limit     int           `json:"limit"`
}

// QueryFilter is a single filter condition
type QueryFilter struct {
	Bin   string `json:"bin"`
	Op    string `json:"op"` // eq, range, contains
	Value any    `json:"value"`
}

// ScanRequest is the request body for a scan
type ScanRequest struct {
	Namespace string   `json:"namespace"`
	Set       string   `json:"set"`
	BinNames  []string `json:"binNames,omitempty"`
	Limit     int      `json:"limit"`
}

// RecordRequest is the body for creating/updating records
type RecordRequest struct {
	Bins map[string]any `json:"bins"`
	TTL  int            `json:"ttl,omitempty"`
}

// PagedRecords is a paginated list of records
type PagedRecords struct {
	Records []RecordResponse `json:"records"`
	Total   int              `json:"total"`
	Page    int              `json:"page"`
	Limit   int              `json:"limit"`
	HasMore bool             `json:"hasMore"`
}

// CreateIndexRequest is the body for creating a secondary index
type CreateIndexRequest struct {
	Namespace string `json:"namespace"`
	Set       string `json:"set"`
	Name      string `json:"name"`
	BinName   string `json:"binName"`
	Type      string `json:"type"` // NUMERIC, STRING, GEO2DSPHERE
}

// AQLRequest is the body for an AQL statement
type AQLRequest struct {
	Statement string `json:"statement"`
}

// AQLResult is the response from an AQL execution
type AQLResult struct {
	Columns  []string         `json:"columns"`
	Rows     []map[string]any `json:"rows"`
	Message  string           `json:"message"` // for DDL/non-SELECT responses
	Error    string           `json:"error,omitempty"`
	Duration int64            `json:"durationMs"`
}

// ErrorResponse is a standard error response
type ErrorResponse struct {
	Error   string `json:"error"`
	Message string `json:"message,omitempty"`
}

// TestConnectionResult is the result of a connection test
type TestConnectionResult struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
	Latency int64  `json:"latencyMs"`
}
