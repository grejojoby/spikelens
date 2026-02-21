import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import type { SecondaryIndex } from '@/types'

export function useIndexes() {
  return useQuery<SecondaryIndex[]>({
    queryKey: ['indexes'],
    queryFn: () => api.get('/api/indexes').then(r => r.data),
  })
}

export function useCreateIndex() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (req: Omit<SecondaryIndex, 'state'>) =>
      api.post('/api/indexes', req).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['indexes'] }),
  })
}

export function useDropIndex() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ namespace, name }: { namespace: string; name: string }) =>
      api.delete(`/api/indexes/${namespace}/${name}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['indexes'] }),
  })
}
