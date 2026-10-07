import { apiRequest } from '../../../shared/api/http-client'
import type { MedicineCatalogFilters, MedicineCatalogPage, MedicineCatalogRow, SaveMedicineInput } from '../types/medicine-catalog'

export const medicineCatalogApi = {
  list: (filters: MedicineCatalogFilters, page: number) => {
    const params = new URLSearchParams({ page: String(page), status: filters.status })
    if (filters.keyword.trim()) params.set('keyword', filters.keyword.trim())
    return apiRequest<MedicineCatalogPage>(`/admin/medicines?${params}`)
  },
  create: (request: SaveMedicineInput) => apiRequest<MedicineCatalogRow>('/admin/medicines', { method: 'POST', body: JSON.stringify(request) }),
  update: (medicine: MedicineCatalogRow, request: SaveMedicineInput) => apiRequest<MedicineCatalogRow>(`/admin/medicines/${medicine.id}`, {
    method: 'PUT', body: JSON.stringify({ ...request, expectedVersion: medicine.version }),
  }),
  setStatus: (medicine: MedicineCatalogRow) => apiRequest<MedicineCatalogRow>(`/admin/medicines/${medicine.id}/status`, {
    method: 'PUT', body: JSON.stringify({ isActive: !medicine.isActive, expectedVersion: medicine.version }),
  }),
}
