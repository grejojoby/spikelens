import { useRef } from 'react'
import MonacoEditor, { type OnMount } from '@monaco-editor/react'
import { Play } from 'lucide-react'
import Button from '@/components/shared/Button'

const AQL_KEYWORDS = [
  'SELECT', 'FROM', 'WHERE', 'INSERT', 'INTO', 'VALUES', 'DELETE',
  'CREATE', 'DROP', 'INDEX', 'ON', 'IN', 'SHOW', 'NAMESPACES', 'SETS',
  'INDEXES', 'LIMIT', 'BETWEEN', 'AND', 'NUMERIC', 'STRING', 'GEO2DSPHERE', 'PK', 'NULL',
]

interface AQLEditorProps {
  value: string
  onChange: (v: string) => void
  onExecute: () => void
  isLoading?: boolean
}

export default function AQLEditor({ value, onChange, onExecute, isLoading }: AQLEditorProps) {
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null)

  const handleMount: OnMount = (editor, monaco) => {
    editorRef.current = editor

    // Register AQL language
    monaco.languages.register({ id: 'aql' })
    monaco.languages.setMonarchTokensProvider('aql', {
      keywords: AQL_KEYWORDS,
      tokenizer: {
        root: [
          [/[a-zA-Z_]\w*/, {
            cases: {
              '@keywords': 'keyword',
              '@default': 'identifier',
            },
          }],
          [/'[^']*'/, 'string'],
          [/\d+(\.\d+)?/, 'number'],
          [/[=<>!]+/, 'operator'],
          [/[,.()*]/, 'delimiter'],
          [/\s+/, 'white'],
        ],
      },
    })

    monaco.languages.registerCompletionItemProvider('aql', {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      provideCompletionItems: (model: any, position: any) => {
        const word = model.getWordUntilPosition(position)
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn,
        }
        return {
          suggestions: AQL_KEYWORDS.map(kw => ({
            label: kw,
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: kw,
            range,
          })),
        }
      },
    })

    // Cmd/Ctrl+Enter to execute
    editor.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter,
      onExecute
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border flex-shrink-0">
        <span className="text-xs text-text-muted">AQL Statement</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-disabled hidden sm:inline">
            {navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}+Enter to run
          </span>
          <Button
            variant="primary"
            size="sm"
            icon={<Play className="w-3 h-3" />}
            loading={isLoading}
            onClick={onExecute}
          >
            Run
          </Button>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 min-h-0">
        <MonacoEditor
          language="aql"
          value={value}
          onChange={v => onChange(v ?? '')}
          onMount={handleMount}
          theme="vs-dark"
          options={{
            fontSize: 13,
            fontFamily: 'JetBrains Mono, Fira Code, monospace',
            minimap: { enabled: false },
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            padding: { top: 12, bottom: 12 },
            renderLineHighlight: 'line',
            overviewRulerBorder: false,
            hideCursorInOverviewRuler: true,
            scrollbar: { verticalScrollbarSize: 6, horizontalScrollbarSize: 6 },
            glyphMargin: false,
            folding: false,
            contextmenu: false,
          }}
        />
      </div>
    </div>
  )
}
