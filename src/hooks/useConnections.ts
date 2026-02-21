import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import { useAppStore } from '@/store/appStore'
import type { ConnectionProfile } from '@/types'

export function useConnections() {
  return useQuery<ConnectionProfile[]>({
    queryKey: ['connections'],
    queryFn: () => api.get('/api/connections').then(r => r.data),
    staleTime: 0,
  })
}

export function useCreateConnection() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (profile: Omit<ConnectionProfile, 'id' | 'active'>) =>
      api.post('/api/connections', profile).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['connections'] }),
  })
}

export function useUpdateConnection() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...profile }: ConnectionProfile) =>
      api.put(`/api/connections/${id}`, profile).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['connections'] }),
  })
}

export function useDeleteConnection() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/connections/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['connections'] }),
  })
}

export function useTestConnection() {
  return useMutation({
    mutationFn: (id: string) =>
      api.post(`/api/connections/${id}/test`).then(r => r.data),
  })
}

export function useActivateConnection() {
  const qc = useQueryClient()
  const setActive = useAppStore(s => s.setActiveConnection)
  return useMutation({
    mutationFn: (id: string) =>
      api.post(`/api/connections/${id}/activate`).then(r => r.data),
    onSuccess: (_data, id) => {
      setActive(id)
      qc.invalidateQueries({ queryKey: ['connections'] })
    },
  })
}
