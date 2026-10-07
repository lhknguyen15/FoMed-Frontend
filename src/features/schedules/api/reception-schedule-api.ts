import { apiRequest } from '../../../shared/api/http-client'
import type { AdminDoctorSchedule, DoctorTimeOff, ScheduleDoctorChoice } from '../types/schedule'
import type { SaveAdminDoctorScheduleBatchInput, SaveAdminDoctorScheduleInput } from './schedule-api'

export const receptionScheduleApi = {
  doctors: () => apiRequest<ScheduleDoctorChoice[]>('/reception/schedules/doctors'),
  schedules: (doctorId?: number) => apiRequest<AdminDoctorSchedule[]>(`/reception/schedules${doctorId ? `?doctorId=${doctorId}` : ''}`),
  timeOff: (doctorId?: number) => apiRequest<DoctorTimeOff[]>(`/reception/schedules/time-off${doctorId ? `?doctorId=${doctorId}` : ''}`),
  create: (request: SaveAdminDoctorScheduleBatchInput) => apiRequest<AdminDoctorSchedule[]>('/reception/schedules/batch', { method: 'POST', body: JSON.stringify(request) }),
  update: (id: number, request: SaveAdminDoctorScheduleInput & { expectedVersion: string }) => apiRequest<AdminDoctorSchedule>(`/reception/schedules/${id}`, { method: 'PUT', body: JSON.stringify(request) }),
  deactivate: (id: number, expectedVersion: string) => apiRequest<null>(`/reception/schedules/${id}?expectedVersion=${encodeURIComponent(expectedVersion)}`, { method: 'DELETE' }),
}
