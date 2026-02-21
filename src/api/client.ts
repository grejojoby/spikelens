import axios from 'axios'

const BASE_URL = (import.meta.env.VITE_API_BASE as string) ?? 'http://localhost:7777'

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
})

export const WS_URL = BASE_URL.replace(/^http/, 'ws')
