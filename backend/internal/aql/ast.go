package aql

// Node is the base interface for all AST nodes
type Node interface {
	stmtNode()
}

// SelectStmt represents SELECT [...] FROM ns.set [WHERE ...] [LIMIT n]
type SelectStmt struct {
	Bins      []string // nil or empty = all bins
	Namespace string
	Set       string
	Where     *WhereClause
	Limit     int // 0 = no limit
}

func (*SelectStmt) stmtNode() {}

// WhereClause is the WHERE portion of a SELECT
type WhereClause struct {
	IsPK      bool   // WHERE PK = 'key'
	PKValue   string
	Bin       string
	Op        string // eq, between
	Value     any
	ValueHigh any // for BETWEEN
}

// InsertStmt represents INSERT INTO ns.set (PK, b1, b2) VALUES (...)
type InsertStmt struct {
	Namespace string
	Set       string
	Columns   []string
	Values    []any
}

func (*InsertStmt) stmtNode() {}

// DeleteStmt represents DELETE FROM ns.set WHERE PK = 'key'
type DeleteStmt struct {
	Namespace string
	Set       string
	PKValue   string
}

func (*DeleteStmt) stmtNode() {}

// CreateIndexStmt represents CREATE INDEX name ON ns.set (bin) NUMERIC|STRING
type CreateIndexStmt struct {
	Name      string
	Namespace string
	Set       string
	BinName   string
	IndexType string // NUMERIC, STRING, GEO2DSPHERE
}

func (*CreateIndexStmt) stmtNode() {}

// DropIndexStmt represents DROP INDEX ns.name
type DropIndexStmt struct {
	Namespace string
	Name      string
}

func (*DropIndexStmt) stmtNode() {}

// ShowStmt represents SHOW NAMESPACES | SETS [IN ns] | INDEXES [IN ns]
type ShowStmt struct {
	What      string // NAMESPACES, SETS, INDEXES
	Namespace string // optional
}

func (*ShowStmt) stmtNode() {}
