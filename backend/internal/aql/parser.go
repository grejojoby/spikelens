package aql

import (
	"fmt"
	"strconv"
	"strings"
)

// Parser converts a token stream into an AST node
type Parser struct {
	tokens []Token
	pos    int
}

// NewParser creates a parser from a token slice
func NewParser(tokens []Token) *Parser {
	return &Parser{tokens: tokens}
}

func (p *Parser) peek() Token {
	if p.pos >= len(p.tokens) {
		return Token{TOKEN_EOF, ""}
	}
	return p.tokens[p.pos]
}

func (p *Parser) advance() Token {
	t := p.peek()
	if t.Type != TOKEN_EOF {
		p.pos++
	}
	return t
}

func (p *Parser) expect(tt TokenType) (Token, error) {
	t := p.advance()
	if t.Type != tt {
		return t, fmt.Errorf("expected token type %d, got %q", tt, t.Literal)
	}
	return t, nil
}

// Parse returns the top-level AST node
func (p *Parser) Parse() (Node, error) {
	switch p.peek().Type {
	case TOKEN_SELECT:
		return p.parseSelect()
	case TOKEN_INSERT:
		return p.parseInsert()
	case TOKEN_DELETE:
		return p.parseDelete()
	case TOKEN_CREATE:
		return p.parseCreateIndex()
	case TOKEN_DROP:
		return p.parseDropIndex()
	case TOKEN_SHOW:
		return p.parseShow()
	default:
		return nil, fmt.Errorf("unknown statement starting with %q", p.peek().Literal)
	}
}

func (p *Parser) parseSelect() (*SelectStmt, error) {
	p.advance() // SELECT
	stmt := &SelectStmt{}

	if p.peek().Type == TOKEN_STAR {
		p.advance()
	} else {
		for {
			col := p.advance()
			if col.Type != TOKEN_IDENT && col.Type != TOKEN_PK {
				return nil, fmt.Errorf("expected column name, got %q", col.Literal)
			}
			stmt.Bins = append(stmt.Bins, col.Literal)
			if p.peek().Type != TOKEN_COMMA {
				break
			}
			p.advance()
		}
	}

	if _, err := p.expect(TOKEN_FROM); err != nil {
		return nil, err
	}
	ns, set, err := p.parseNSSet()
	if err != nil {
		return nil, err
	}
	stmt.Namespace = ns
	stmt.Set = set

	if p.peek().Type == TOKEN_WHERE {
		p.advance()
		where, err := p.parseWhere()
		if err != nil {
			return nil, err
		}
		stmt.Where = where
	}

	if p.peek().Type == TOKEN_LIMIT {
		p.advance()
		numTok, err := p.expect(TOKEN_NUMBER)
		if err != nil {
			return nil, err
		}
		n, _ := strconv.Atoi(numTok.Literal)
		stmt.Limit = n
	}

	return stmt, nil
}

func (p *Parser) parseNSSet() (string, string, error) {
	ns := p.advance()
	if ns.Type != TOKEN_IDENT {
		return "", "", fmt.Errorf("expected namespace, got %q", ns.Literal)
	}
	if p.peek().Type != TOKEN_DOT {
		return ns.Literal, "", nil
	}
	p.advance() // dot
	set := p.advance()
	if set.Type != TOKEN_IDENT {
		return "", "", fmt.Errorf("expected set name, got %q", set.Literal)
	}
	return ns.Literal, set.Literal, nil
}

func (p *Parser) parseWhere() (*WhereClause, error) {
	wc := &WhereClause{}
	col := p.advance()
	if col.Type == TOKEN_PK {
		wc.IsPK = true
		if _, err := p.expect(TOKEN_EQ); err != nil {
			return nil, err
		}
		val, err := p.parseLiteral()
		if err != nil {
			return nil, err
		}
		wc.PKValue = val
		return wc, nil
	}
	if col.Type != TOKEN_IDENT {
		return nil, fmt.Errorf("expected bin name in WHERE, got %q", col.Literal)
	}
	wc.Bin = col.Literal

	op := p.advance()
	switch op.Type {
	case TOKEN_EQ:
		wc.Op = "eq"
		val, err := p.parseLiteral()
		if err != nil {
			return nil, err
		}
		wc.Value = val
	case TOKEN_BETWEEN:
		wc.Op = "between"
		lo, err := p.parseLiteral()
		if err != nil {
			return nil, err
		}
		wc.Value = lo
		if _, err := p.expect(TOKEN_AND); err != nil {
			return nil, err
		}
		hi, err := p.parseLiteral()
		if err != nil {
			return nil, err
		}
		wc.ValueHigh = hi
	default:
		return nil, fmt.Errorf("unsupported WHERE operator: %q", op.Literal)
	}
	return wc, nil
}

func (p *Parser) parseLiteral() (any, error) {
	t := p.advance()
	switch t.Type {
	case TOKEN_STRING_LIT:
		return t.Literal, nil
	case TOKEN_NUMBER:
		if strings.Contains(t.Literal, ".") {
			f, err := strconv.ParseFloat(t.Literal, 64)
			if err != nil {
				return nil, err
			}
			return f, nil
		}
		n, err := strconv.ParseInt(t.Literal, 10, 64)
		if err != nil {
			return nil, err
		}
		return n, nil
	case TOKEN_NULL:
		return nil, nil
	default:
		return t.Literal, nil
	}
}

func (p *Parser) parseInsert() (*InsertStmt, error) {
	p.advance() // INSERT
	if _, err := p.expect(TOKEN_INTO); err != nil {
		return nil, err
	}
	ns, set, err := p.parseNSSet()
	if err != nil {
		return nil, err
	}
	stmt := &InsertStmt{Namespace: ns, Set: set}

	if _, err := p.expect(TOKEN_LPAREN); err != nil {
		return nil, err
	}
	for {
		col := p.advance()
		if col.Type != TOKEN_IDENT && col.Type != TOKEN_PK {
			return nil, fmt.Errorf("expected column name, got %q", col.Literal)
		}
		stmt.Columns = append(stmt.Columns, col.Literal)
		if p.peek().Type == TOKEN_COMMA {
			p.advance()
		} else {
			break
		}
	}
	if _, err := p.expect(TOKEN_RPAREN); err != nil {
		return nil, err
	}

	valTok := p.advance()
	if valTok.Type != TOKEN_VALUES {
		return nil, fmt.Errorf("expected VALUES, got %q", valTok.Literal)
	}
	if _, err := p.expect(TOKEN_LPAREN); err != nil {
		return nil, err
	}
	for {
		v, err := p.parseLiteral()
		if err != nil {
			return nil, err
		}
		stmt.Values = append(stmt.Values, v)
		if p.peek().Type == TOKEN_COMMA {
			p.advance()
		} else {
			break
		}
	}
	if _, err := p.expect(TOKEN_RPAREN); err != nil {
		return nil, err
	}
	return stmt, nil
}

func (p *Parser) parseDelete() (*DeleteStmt, error) {
	p.advance() // DELETE
	if _, err := p.expect(TOKEN_FROM); err != nil {
		return nil, err
	}
	ns, set, err := p.parseNSSet()
	if err != nil {
		return nil, err
	}
	if _, err := p.expect(TOKEN_WHERE); err != nil {
		return nil, err
	}
	if _, err := p.expect(TOKEN_PK); err != nil {
		return nil, err
	}
	if _, err := p.expect(TOKEN_EQ); err != nil {
		return nil, err
	}
	val, err := p.parseLiteral()
	if err != nil {
		return nil, err
	}
	return &DeleteStmt{Namespace: ns, Set: set, PKValue: val}, nil
}

func (p *Parser) parseCreateIndex() (*CreateIndexStmt, error) {
	p.advance() // CREATE
	if _, err := p.expect(TOKEN_INDEX); err != nil {
		return nil, err
	}
	nameTok := p.advance()
	if nameTok.Type != TOKEN_IDENT {
		return nil, fmt.Errorf("expected index name, got %q", nameTok.Literal)
	}
	if _, err := p.expect(TOKEN_ON); err != nil {
		return nil, err
	}
	ns, set, err := p.parseNSSet()
	if err != nil {
		return nil, err
	}
	if _, err := p.expect(TOKEN_LPAREN); err != nil {
		return nil, err
	}
	binTok := p.advance()
	if _, err := p.expect(TOKEN_RPAREN); err != nil {
		return nil, err
	}
	typeTok := p.advance()
	return &CreateIndexStmt{
		Name:      nameTok.Literal,
		Namespace: ns,
		Set:       set,
		BinName:   binTok.Literal,
		IndexType: strings.ToUpper(typeTok.Literal),
	}, nil
}

func (p *Parser) parseDropIndex() (*DropIndexStmt, error) {
	p.advance() // DROP
	if _, err := p.expect(TOKEN_INDEX); err != nil {
		return nil, err
	}
	ns, name, err := p.parseNSSet()
	if err != nil {
		return nil, err
	}
	return &DropIndexStmt{Namespace: ns, Name: name}, nil
}

func (p *Parser) parseShow() (*ShowStmt, error) {
	p.advance() // SHOW
	what := p.advance()
	stmt := &ShowStmt{}
	switch what.Type {
	case TOKEN_NAMESPACES:
		stmt.What = "NAMESPACES"
	case TOKEN_SETS:
		stmt.What = "SETS"
	case TOKEN_INDEXES:
		stmt.What = "INDEXES"
	default:
		return nil, fmt.Errorf("expected NAMESPACES, SETS, or INDEXES after SHOW, got %q", what.Literal)
	}
	if p.peek().Type == TOKEN_IN {
		p.advance()
		nsTok := p.advance()
		stmt.Namespace = nsTok.Literal
	}
	return stmt, nil
}
