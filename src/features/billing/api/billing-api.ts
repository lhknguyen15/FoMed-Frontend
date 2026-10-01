import { apiRequest } from '../../../shared/api/http-client'
import type { MedicalService } from '../types/billing'

export const serviceAdminApi = {
  list: () => apiRequest<MedicalService[]>('/admin/services'),
}
