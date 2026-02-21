import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { NavPage } from '@/types'

interface AppState {
  activeConnectionId: string | null
  currentPage: NavPage
  theme: 'dark' | 'light'
  setActiveConnection: (id: string | null) => void
  setCurrentPage: (page: NavPage) => void
  setTheme: (theme: 'dark' | 'light') => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      activeConnectionId: null,
      currentPage: 'connections',
      theme: 'dark',
      setActiveConnection: (id) => set({ activeConnectionId: id }),
      setCurrentPage: (page) => set({ currentPage: page }),
      setTheme: (theme) => set({ theme }),
    }),
    { name: 'spikelens-app' }
  )
)
