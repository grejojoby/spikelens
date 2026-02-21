export interface ConnectionProfile {
  id: string
  name: string
  host: string
  port: number
  user?: string
  password?: string
  tlsEnable: boolean
  active: boolean
}

export interface RecordResponse {
  key: string
  generation: number
  expiry: number
  bins: Record<string, unknown>
}

export interface NamespaceInfo {
  name: string
  sets?: SetInfo[]
  setCount: number
}

export interface SetInfo {
  name: string
  namespace: string
  recordCount: number
  memoryBytes: number
}

export interface NodeStat {
  name: string
  address: string
  active: boolean
  connections: number
  stats: Record<string, string>
}

export interface ClusterInfo {
  nodes: NodeStat[]
  nodeCount: number
}

export interface SecondaryIndex {
  namespace: string
  set: string
  name: string
  binName: string
  type: 'NUMERIC' | 'STRING' | 'GEO2DSPHERE'
  state: string
}

export interface QueryFilter {
  bin: string
  op: 'eq' | 'range' | 'contains'
  value: unknown
}

export interface QueryRequest {
  namespace: string
  set: string
  indexName?: string
  filters: QueryFilter[]
  binNames?: string[]
  limit: number
}

export interface PagedRecords {
  records: RecordResponse[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

export interface AQLResult {
  columns: string[]
  rows: Record<string, unknown>[]
  message: string
  error?: string
  durationMs: number
}

export interface TestConnectionResult {
  success: boolean
  message: string
  latencyMs: number
}

export type NavPage = 'connections' | 'browser' | 'query' | 'aql' | 'dashboard' | 'indexes'
