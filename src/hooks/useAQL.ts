import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { api } from '@/api/client'
import type { AQLResult } from '@/types'

const MAX_HISTORY = 50

export function useAQL() {
  const [history, setHistory] = useState<string[]>([])
  const [result, setResult] = useState<AQLResult | null>(null)

  const mutation = useMutation<AQLResult, Error, string>({
    mutationFn: (statement) =>
      api.post('/api/aql/execute', { statement }).then(r => r.data),
    onSuccess: (data, statement) => {
      setResult(data)
      setHistory(prev => {
        const next = [statement, ...prev.filter(s => s !== statement)]
        return next.slice(0, MAX_HISTORY)
      })
    },
  })

  return {
    execute: (stmt: string) => mutation.mutate(stmt),
    result,
    isLoading: mutation.isPending,
    error: mutation.error,
    history,
    clearResult: () => setResult(null),
  }
}
