import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import type { PagedRecords, RecordResponse } from '@/types'

export function useNamespaces() {
  return useQuery({
    queryKey: ['namespaces'],
    queryFn: () => api.get('/api/namespaces').then(r => r.data),
  })
}

export function useSets(ns: string) {
  return useQuery({
    queryKey: ['sets', ns],
    queryFn: () => api.get(`/api/namespaces/${ns}/sets`).then(r => r.data),
    enabled: !!ns,
  })
}

export function useRecords(ns: string, set: string, page = 1, limit = 50) {
  return useQuery<PagedRecords>({
    queryKey: ['records', ns, set, page, limit],
    queryFn: () =>
      api
        .get(`/api/namespaces/${ns}/sets/${set}/records`, { params: { page, limit } })
        .then(r => r.data),
    enabled: !!ns && !!set,
  })
}

export function useRecord(ns: string, set: string, key: string) {
  return useQuery<RecordResponse>({
    queryKey: ['record', ns, set, key],
    queryFn: () =>
      api.get(`/api/namespaces/${ns}/sets/${set}/records/${encodeURIComponent(key)}`).then(r => r.data),
    enabled: !!ns && !!set && !!key,
  })
}

export function useUpdateRecord() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      ns,
      set,
      key,
      bins,
    }: {
      ns: string
      set: string
      key: string
      bins: Record<string, unknown>
    }) =>
      api
        .put(`/api/namespaces/${ns}/sets/${set}/records/${encodeURIComponent(key)}`, { bins })
        .then(r => r.data),
    onSuccess: (_data, { ns, set }) => {
      qc.invalidateQueries({ queryKey: ['records', ns, set] })
    },
  })
}

export function useDeleteRecord() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ ns, set, key }: { ns: string; set: string; key: string }) =>
      api.delete(`/api/namespaces/${ns}/sets/${set}/records/${encodeURIComponent(key)}`),
    onSuccess: (_data, { ns, set }) => {
      qc.invalidateQueries({ queryKey: ['records', ns, set] })
    },
  })
}
