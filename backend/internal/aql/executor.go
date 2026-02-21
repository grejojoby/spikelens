package aql

import (
	"fmt"
	"strings"
	"time"

	as "github.com/aerospike/aerospike-client-go/v7"
	"github.com/grejo-j/spikelens/backend/internal/models"
)

// Executor executes AQL AST nodes against an Aerospike client
type Executor struct {
	client *as.Client
}

// NewExecutor creates a new executor with the given Aerospike client
func NewExecutor(client *as.Client) *Executor {
	return &Executor{client: client}
}

// Execute parses and runs the given AQL statement
func (e *Executor) Execute(stmt string) *models.AQLResult {
	start := time.Now()
	tokens := NewLexer(stmt).Tokenize()
	node, err := NewParser(tokens).Parse()
	if err != nil {
		return &models.AQLResult{Error: "parse error: " + err.Error(), Duration: time.Since(start).Milliseconds()}
	}
	result, execErr := e.execute(node)
	if execErr != nil {
		return &models.AQLResult{Error: execErr.Error(), Duration: time.Since(start).Milliseconds()}
	}
	result.Duration = time.Since(start).Milliseconds()
	return result
}

func (e *Executor) execute(node Node) (*models.AQLResult, error) {
	switch n := node.(type) {
	case *SelectStmt:
		return e.execSelect(n)
	case *InsertStmt:
		return e.execInsert(n)
	case *DeleteStmt:
		return e.execDelete(n)
	case *CreateIndexStmt:
		return e.execCreateIndex(n)
	case *DropIndexStmt:
		return e.execDropIndex(n)
	case *ShowStmt:
		return e.execShow(n)
	default:
		return nil, fmt.Errorf("unknown AST node type")
	}
}

func (e *Executor) execSelect(stmt *SelectStmt) (*models.AQLResult, error) {
	var binNames []string
	if len(stmt.Bins) > 0 {
		binNames = stmt.Bins
	}

	var records []*as.Record

	if stmt.Where != nil && stmt.Where.IsPK {
		key, err := as.NewKey(stmt.Namespace, stmt.Set, stmt.Where.PKValue)
		if err != nil {
			return nil, err
		}
		var rec *as.Record
		if len(binNames) > 0 {
			rec, err = e.client.Get(as.NewPolicy(), key, binNames...)
		} else {
			rec, err = e.client.Get(as.NewPolicy(), key)
		}
		if err != nil {
			return nil, err
		}
		if rec != nil {
			records = []*as.Record{rec}
		}
	} else if stmt.Where != nil {
		statement := as.NewStatement(stmt.Namespace, stmt.Set)
		if len(binNames) > 0 {
			statement.BinNames = binNames
		}
		qp := as.NewQueryPolicy()
		if stmt.Limit > 0 {
			qp.MaxRecords = int64(stmt.Limit)
		}
		switch stmt.Where.Op {
		case "eq":
			switch v := stmt.Where.Value.(type) {
			case int64:
				statement.SetFilter(as.NewEqualFilter(stmt.Where.Bin, v))
			case string:
				statement.SetFilter(as.NewEqualFilter(stmt.Where.Bin, v))
			}
		case "between":
			lo, _ := toInt64(stmt.Where.Value)
			hi, _ := toInt64(stmt.Where.ValueHigh)
			statement.SetFilter(as.NewRangeFilter(stmt.Where.Bin, lo, hi))
		}
		rs, err := e.client.Query(qp, statement)
		if err != nil {
			return nil, err
		}
		defer rs.Close()
		for res := range rs.Results() {
			if res.Err == nil {
				records = append(records, res.Record)
			}
		}
	} else {
		sp := as.NewScanPolicy()
		if stmt.Limit > 0 {
			sp.MaxRecords = int64(stmt.Limit)
		}
		rs, err := e.client.ScanAll(sp, stmt.Namespace, stmt.Set, binNames...)
		if err != nil {
			return nil, err
		}
		defer rs.Close()
		for res := range rs.Results() {
			if res.Err == nil {
				records = append(records, res.Record)
			}
		}
	}
	return recordsToResult(records), nil
}

func (e *Executor) execInsert(stmt *InsertStmt) (*models.AQLResult, error) {
	if len(stmt.Columns) != len(stmt.Values) {
		return nil, fmt.Errorf("column and value count mismatch")
	}
	var pkVal any
	bins := make([]*as.Bin, 0)
	for i, col := range stmt.Columns {
		if strings.ToUpper(col) == "PK" {
			pkVal = stmt.Values[i]
		} else {
			bins = append(bins, as.NewBin(col, stmt.Values[i]))
		}
	}
	if pkVal == nil {
		return nil, fmt.Errorf("INSERT requires PK column")
	}
	key, err := as.NewKey(stmt.Namespace, stmt.Set, pkVal)
	if err != nil {
		return nil, err
	}
	if err := e.client.PutBins(as.NewWritePolicy(0, 0), key, bins...); err != nil {
		return nil, err
	}
	return &models.AQLResult{Message: "OK, 1 record written"}, nil
}

func (e *Executor) execDelete(stmt *DeleteStmt) (*models.AQLResult, error) {
	key, err := as.NewKey(stmt.Namespace, stmt.Set, stmt.PKValue)
	if err != nil {
		return nil, err
	}
	existed, err := e.client.Delete(as.NewWritePolicy(0, 0), key)
	if err != nil {
		return nil, err
	}
	if existed {
		return &models.AQLResult{Message: "OK, 1 record deleted"}, nil
	}
	return &models.AQLResult{Message: "OK, 0 records deleted (key not found)"}, nil
}

func (e *Executor) execCreateIndex(stmt *CreateIndexStmt) (*models.AQLResult, error) {
	var it as.IndexType
	switch strings.ToUpper(stmt.IndexType) {
	case "NUMERIC":
		it = as.NUMERIC
	case "STRING":
		it = as.STRING
	case "GEO2DSPHERE":
		it = as.GEO2DSPHERE
	default:
		return nil, fmt.Errorf("unknown index type: %s", stmt.IndexType)
	}
	task, err := e.client.CreateIndex(as.NewWritePolicy(0, 0), stmt.Namespace, stmt.Set, stmt.Name, stmt.BinName, it)
	if err != nil {
		return nil, err
	}
	if err := <-task.OnComplete(); err != nil {
		return nil, err
	}
	return &models.AQLResult{Message: fmt.Sprintf("Index %s created successfully", stmt.Name)}, nil
}

func (e *Executor) execDropIndex(stmt *DropIndexStmt) (*models.AQLResult, error) {
	if err := e.client.DropIndex(as.NewWritePolicy(0, 0), stmt.Namespace, stmt.Name, ""); err != nil {
		return nil, err
	}
	return &models.AQLResult{Message: fmt.Sprintf("Index %s dropped successfully", stmt.Name)}, nil
}

func (e *Executor) execShow(stmt *ShowStmt) (*models.AQLResult, error) {
	nodes := e.client.GetNodes()
	if len(nodes) == 0 {
		return nil, fmt.Errorf("no nodes available")
	}
	node := nodes[0]
	policy := as.NewInfoPolicy()

	switch stmt.What {
	case "NAMESPACES":
		info, err := node.RequestInfo(policy, "namespaces")
		if err != nil {
			return nil, err
		}
		rows := []map[string]any{}
		for _, ns := range strings.Split(info["namespaces"], ";") {
			if ns = strings.TrimSpace(ns); ns != "" {
				rows = append(rows, map[string]any{"namespace": ns})
			}
		}
		return &models.AQLResult{Columns: []string{"namespace"}, Rows: rows}, nil

	case "SETS":
		info, err := node.RequestInfo(policy, "sets")
		if err != nil {
			return nil, err
		}
		return parseInfoResult(info["sets"]), nil

	case "INDEXES":
		info, err := node.RequestInfo(policy, "sindex")
		if err != nil {
			return nil, err
		}
		return parseInfoResult(info["sindex"]), nil
	}
	return nil, fmt.Errorf("unknown SHOW target: %s", stmt.What)
}

func recordsToResult(records []*as.Record) *models.AQLResult {
	if len(records) == 0 {
		return &models.AQLResult{Columns: []string{}, Rows: []map[string]any{}}
	}
	colSet := map[string]bool{}
	rows := make([]map[string]any, 0, len(records))
	for _, rec := range records {
		row := make(map[string]any, len(rec.Bins))
		for k, v := range rec.Bins {
			row[k] = v
			colSet[k] = true
		}
		rows = append(rows, row)
	}
	cols := make([]string, 0, len(colSet))
	for c := range colSet {
		cols = append(cols, c)
	}
	return &models.AQLResult{Columns: cols, Rows: rows}
}

func parseInfoResult(raw string) *models.AQLResult {
	rows := []map[string]any{}
	colSet := map[string]bool{}
	for _, entry := range strings.Split(raw, ";") {
		entry = strings.TrimSpace(entry)
		if entry == "" {
			continue
		}
		row := map[string]any{}
		for _, part := range strings.Split(entry, ":") {
			kv := strings.SplitN(part, "=", 2)
			if len(kv) == 2 {
				row[kv[0]] = kv[1]
				colSet[kv[0]] = true
			}
		}
		if len(row) > 0 {
			rows = append(rows, row)
		}
	}
	cols := make([]string, 0, len(colSet))
	for c := range colSet {
		cols = append(cols, c)
	}
	return &models.AQLResult{Columns: cols, Rows: rows}
}

func toInt64(v any) (int64, bool) {
	switch n := v.(type) {
	case int64:
		return n, true
	case float64:
		return int64(n), true
	}
	return 0, false
}
