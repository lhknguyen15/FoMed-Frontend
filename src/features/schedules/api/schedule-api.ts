import { apiRequest } from '../../../shared/api/http-client'
import type { DoctorTimeOff } from '../types/schedule'

export const scheduleAdminApi = {
  timeOff: (doctorId?: number) => apiRequest<DoctorTimeOff[]>(`/admin/time-off${doctorId ? `?doctorId=${doctorId}` : ''}`),
  createTimeOff: (request: SaveDoctorTimeOffInput) => apiRequest<DoctorTimeOff>('/admin/time-off', {
    method: 'POST',
    body: JSON.stringify(request),
  }),
  updateTimeOff: (id: number, request: SaveDoctorTimeOffInput) => apiRequest<DoctorTimeOff>(`/admin/time-off/${id}`, {
    method: 'PUT',
    body: JSON.stringify(request),
  }),
  deleteTimeOff: (id: number) => apiRequest<null>(`/admin/time-off/${id}`, { method: 'DELETE' }),
}

export type SaveDoctorTimeOffInput = {
  doctorId?: number
  startAt: string
  endAt: string
  reason?: string
}
