import { apiRequest } from '../../../shared/api/http-client'
import type { AuditLogPage } from '../types/audit'

export const auditApi = {
  list: (filters: { action?: string; page?: number; pageSize?: number } = {}) => {
    const params = new URLSearchParams({ page: String(filters.page ?? 1), pageSize: String(filters.pageSize ?? 50) })
    if (filters.action) params.set('action', filters.action)
    return apiRequest<AuditLogPage>(`/audit-logs?${params}`)
  },
}
