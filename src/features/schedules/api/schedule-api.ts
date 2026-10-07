import { apiRequest } from '../../../shared/api/http-client'
import type { AdminDoctorSchedule, DoctorTimeOff } from '../types/schedule'

export const scheduleAdminApi = {
  schedules: () => apiRequest<AdminDoctorSchedule[]>('/admin/schedules'),
  createSchedule: (request: SaveAdminDoctorScheduleInput) => apiRequest<AdminDoctorSchedule>('/admin/schedules', { method: 'POST', body: JSON.stringify(request) }),
  createSchedules: (request: SaveAdminDoctorScheduleBatchInput) => apiRequest<AdminDoctorSchedule[]>('/admin/schedules/batch', { method: 'POST', body: JSON.stringify(request) }),
  updateSchedule: (id: number, request: SaveAdminDoctorScheduleInput) => apiRequest<AdminDoctorSchedule>(`/admin/schedules/${id}`, { method: 'PUT', body: JSON.stringify(request) }),
  deleteSchedule: (id: number, expectedVersion?: string) => apiRequest<null>(`/admin/schedules/${id}${expectedVersion ? `?expectedVersion=${encodeURIComponent(expectedVersion)}` : ''}`, { method: 'DELETE' }),
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

export type SaveAdminDoctorScheduleInput = { expectedVersion?: string; doctorId: number; dayOfWeek: number; startTime: string; endTime: string; slotMinutes: number; isActive: boolean }
export type SaveAdminDoctorScheduleBatchInput = { doctorId: number; dayOfWeeks: number[]; startTime: string; endTime: string; slotMinutes: number; isActive: boolean }

export type SaveDoctorTimeOffInput = {
  doctorId?: number
  startAt: string
  endAt: string
  reason?: string
}
