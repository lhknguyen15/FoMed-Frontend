import { apiRequest } from '../../../shared/api/http-client'
import type { DoctorTimeOff } from '../types/schedule'

export const scheduleAdminApi = {
  timeOff: (doctorId?: number) => apiRequest<DoctorTimeOff[]>(`/admin/time-off${doctorId ? `?doctorId=${doctorId}` : ''}`),
}
