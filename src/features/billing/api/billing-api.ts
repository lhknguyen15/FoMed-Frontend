import { apiRequest } from '../../../shared/api/http-client'
import type { CreateMedicalServiceInput, MedicalService, UpdateMedicalServiceInput } from '../types/billing'

export const serviceAdminApi = {
  list: () => apiRequest<MedicalService[]>('/admin/services'),
  create: (request: CreateMedicalServiceInput) => apiRequest<MedicalService>('/admin/services', {
    method: 'POST',
    body: JSON.stringify(request),
  }),
  update: (serviceId: number, request: UpdateMedicalServiceInput) => apiRequest<MedicalService>(`/admin/services/${serviceId}`, {
    method: 'PUT',
    body: JSON.stringify(request),
  }),
}
