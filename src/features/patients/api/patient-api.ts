import { apiRequest } from '../../../shared/api/http-client'
import type { Patient, PatientHistory, PatientSearchFilters } from '../types/patient'

export const patientApi = {
  me: () => apiRequest<Patient>('/patient/me'),
}

export const patientStaffApi = {
  search: (filters: PatientSearchFilters = {}) => {
    const params = new URLSearchParams()
    if (filters.phone) params.set('phone', filters.phone)
    if (filters.name) params.set('name', filters.name)
    if (filters.patientCode) params.set('patientCode', filters.patientCode)
    params.set('page', String(filters.page ?? 1)); params.set('pageSize', String(filters.pageSize ?? 20))
    return apiRequest<Patient[]>(`/patients/staff?${params.toString()}`)
  },
  get: (id: number) => apiRequest<Patient>(`/patients/staff/${id}`),
  create: (request: Record<string, unknown>) => apiRequest<Patient>('/patients/staff', { method: 'POST', body: JSON.stringify(request) }),
  update: (id: number, request: Record<string, unknown>) => apiRequest<Patient>(`/patients/staff/${id}`, { method: 'PUT', body: JSON.stringify(request) }),
  history: (id: number) => apiRequest<PatientHistory[]>(`/patients/staff/${id}/history`),
}
