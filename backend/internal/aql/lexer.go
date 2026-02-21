package aql

import (
	"strings"
	"unicode"
)

// TokenType identifies a lexical token
type TokenType int

const (
	TOKEN_SELECT TokenType = iota
	TOKEN_FROM
	TOKEN_WHERE
	TOKEN_INSERT
	TOKEN_INTO
	TOKEN_VALUES
	TOKEN_DELETE
	TOKEN_CREATE
	TOKEN_DROP
	TOKEN_INDEX
	TOKEN_ON
	TOKEN_IN
	TOKEN_SHOW
	TOKEN_NAMESPACES
	TOKEN_SETS
	TOKEN_INDEXES
	TOKEN_LIMIT
	TOKEN_BETWEEN
	TOKEN_AND
	TOKEN_NUMERIC
	TOKEN_STRING
	TOKEN_GEO2DSPHERE
	TOKEN_PK
	TOKEN_NULL

	TOKEN_IDENT
	TOKEN_STRING_LIT
	TOKEN_NUMBER
	TOKEN_STAR

	TOKEN_EQ
	TOKEN_NEQ
	TOKEN_LT
	TOKEN_GT
	TOKEN_LTE
	TOKEN_GTE
	TOKEN_COMMA
	TOKEN_DOT
	TOKEN_LPAREN
	TOKEN_RPAREN

	TOKEN_EOF
	TOKEN_ILLEGAL
)

var keywords = map[string]TokenType{
	"SELECT":      TOKEN_SELECT,
	"FROM":        TOKEN_FROM,
	"WHERE":       TOKEN_WHERE,
	"INSERT":      TOKEN_INSERT,
	"INTO":        TOKEN_INTO,
	"VALUES":      TOKEN_VALUES,
	"DELETE":      TOKEN_DELETE,
	"CREATE":      TOKEN_CREATE,
	"DROP":        TOKEN_DROP,
	"INDEX":       TOKEN_INDEX,
	"ON":          TOKEN_ON,
	"IN":          TOKEN_IN,
	"SHOW":        TOKEN_SHOW,
	"NAMESPACES":  TOKEN_NAMESPACES,
	"SETS":        TOKEN_SETS,
	"INDEXES":     TOKEN_INDEXES,
	"LIMIT":       TOKEN_LIMIT,
	"BETWEEN":     TOKEN_BETWEEN,
	"AND":         TOKEN_AND,
	"NUMERIC":     TOKEN_NUMERIC,
	"STRING":      TOKEN_STRING,
	"GEO2DSPHERE": TOKEN_GEO2DSPHERE,
	"PK":          TOKEN_PK,
	"NULL":        TOKEN_NULL,
}

// Token is a lexical unit
type Token struct {
	Type    TokenType
	Literal string
}

// Lexer tokenizes an AQL input string
type Lexer struct {
	input  []rune
	pos    int
	tokens []Token
}

// NewLexer creates a new lexer for the given input
func NewLexer(input string) *Lexer {
	return &Lexer{input: []rune(strings.TrimSpace(input))}
}

// Tokenize scans the input and returns all tokens
func (l *Lexer) Tokenize() []Token {
	for l.pos < len(l.input) {
		l.skipWhitespace()
		if l.pos >= len(l.input) {
			break
		}
		ch := l.input[l.pos]
		switch {
		case ch == '\'':
			l.readStringLit()
		case unicode.IsDigit(ch) || (ch == '-' && l.pos+1 < len(l.input) && unicode.IsDigit(l.input[l.pos+1])):
			l.readNumber()
		case unicode.IsLetter(ch) || ch == '_':
			l.readIdent()
		case ch == '*':
			l.tokens = append(l.tokens, Token{TOKEN_STAR, "*"})
			l.pos++
		case ch == '=':
			l.tokens = append(l.tokens, Token{TOKEN_EQ, "="})
			l.pos++
		case ch == '!':
			if l.pos+1 < len(l.input) && l.input[l.pos+1] == '=' {
				l.tokens = append(l.tokens, Token{TOKEN_NEQ, "!="})
				l.pos += 2
			} else {
				l.tokens = append(l.tokens, Token{TOKEN_ILLEGAL, string(ch)})
				l.pos++
			}
		case ch == '<':
			if l.pos+1 < len(l.input) && l.input[l.pos+1] == '=' {
				l.tokens = append(l.tokens, Token{TOKEN_LTE, "<="})
				l.pos += 2
			} else {
				l.tokens = append(l.tokens, Token{TOKEN_LT, "<"})
				l.pos++
			}
		case ch == '>':
			if l.pos+1 < len(l.input) && l.input[l.pos+1] == '=' {
				l.tokens = append(l.tokens, Token{TOKEN_GTE, ">="})
				l.pos += 2
			} else {
				l.tokens = append(l.tokens, Token{TOKEN_GT, ">"})
				l.pos++
			}
		case ch == ',':
			l.tokens = append(l.tokens, Token{TOKEN_COMMA, ","})
			l.pos++
		case ch == '.':
			l.tokens = append(l.tokens, Token{TOKEN_DOT, "."})
			l.pos++
		case ch == '(':
			l.tokens = append(l.tokens, Token{TOKEN_LPAREN, "("})
			l.pos++
		case ch == ')':
			l.tokens = append(l.tokens, Token{TOKEN_RPAREN, ")"})
			l.pos++
		default:
			l.tokens = append(l.tokens, Token{TOKEN_ILLEGAL, string(ch)})
			l.pos++
		}
	}
	l.tokens = append(l.tokens, Token{TOKEN_EOF, ""})
	return l.tokens
}

func (l *Lexer) skipWhitespace() {
	for l.pos < len(l.input) && unicode.IsSpace(l.input[l.pos]) {
		l.pos++
	}
}

func (l *Lexer) readIdent() {
	start := l.pos
	for l.pos < len(l.input) && (unicode.IsLetter(l.input[l.pos]) || unicode.IsDigit(l.input[l.pos]) || l.input[l.pos] == '_') {
		l.pos++
	}
	literal := string(l.input[start:l.pos])
	upper := strings.ToUpper(literal)
	if tt, ok := keywords[upper]; ok {
		l.tokens = append(l.tokens, Token{tt, upper})
	} else {
		l.tokens = append(l.tokens, Token{TOKEN_IDENT, literal})
	}
}

func (l *Lexer) readStringLit() {
	l.pos++ // skip opening quote
	start := l.pos
	for l.pos < len(l.input) && l.input[l.pos] != '\'' {
		if l.input[l.pos] == '\\' {
			l.pos++
		}
		l.pos++
	}
	literal := string(l.input[start:l.pos])
	if l.pos < len(l.input) {
		l.pos++ // skip closing quote
	}
	l.tokens = append(l.tokens, Token{TOKEN_STRING_LIT, literal})
}

func (l *Lexer) readNumber() {
	start := l.pos
	if l.input[l.pos] == '-' {
		l.pos++
	}
	for l.pos < len(l.input) && (unicode.IsDigit(l.input[l.pos]) || l.input[l.pos] == '.') {
		l.pos++
	}
	l.tokens = append(l.tokens, Token{TOKEN_NUMBER, string(l.input[start:l.pos])})
}
