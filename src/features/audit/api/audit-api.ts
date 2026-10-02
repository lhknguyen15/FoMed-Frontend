import { apiRequest } from '../../../shared/api/http-client'
import type { AuditLogPage } from '../types/audit'

export const auditApi = {
  list: (filters: { entity?: string; action?: string; userId?: number; from?: string; to?: string; page?: number; pageSize?: number } = {}) => {
    const params = new URLSearchParams({ page: String(filters.page ?? 1), pageSize: String(filters.pageSize ?? 50) })
    if (filters.entity) params.set('entity', filters.entity)
    if (filters.action) params.set('action', filters.action)
    if (filters.userId) params.set('userId', String(filters.userId))
    if (filters.from) params.set('from', filters.from)
    if (filters.to) params.set('to', filters.to)
    return apiRequest<AuditLogPage>(`/audit-logs?${params}`)
  },
}
