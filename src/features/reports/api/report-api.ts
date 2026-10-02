import { apiDownload, apiRequest } from '../../../shared/api/http-client'
import type { ReportSummary } from '../types/report'

export const reportApi = {
  summary: (filters: { from?: string; to?: string; doctorId?: number } = {}) => {
    const params = new URLSearchParams()
    if (filters.from) params.set('from', filters.from)
    if (filters.to) params.set('to', filters.to)
    if (filters.doctorId) params.set('doctorId', String(filters.doctorId))
    const query = params.toString()
    return apiRequest<ReportSummary>(`/reports/summary${query ? `?${query}` : ''}`)
  },
  exportCsv: (filters: { from?: string; to?: string; doctorId?: number } = {}) => {
    const params = new URLSearchParams()
    if (filters.from) params.set('from', filters.from)
    if (filters.to) params.set('to', filters.to)
    if (filters.doctorId) params.set('doctorId', String(filters.doctorId))
    const query = params.toString()
    return apiDownload(`/reports/export${query ? `?${query}` : ''}`)
  },
}
