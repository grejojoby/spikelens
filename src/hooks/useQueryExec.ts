import { useMutation } from '@tanstack/react-query'
import { api } from '@/api/client'
import type { QueryRequest, RecordResponse } from '@/types'

export function useExecuteQuery() {
  return useMutation<RecordResponse[], Error, QueryRequest>({
    mutationFn: (req) => api.post('/api/query', req).then(r => r.data),
  })
}

export function useExecuteScan() {
  return useMutation<RecordResponse[], Error, { namespace: string; set: string; limit?: number }>({
    mutationFn: (req) => api.post('/api/scan', req).then(r => r.data),
  })
}
