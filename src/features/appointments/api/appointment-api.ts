import { apiRequest } from '../../../shared/api/http-client'
import type { Appointment, AppointmentFilters, AppointmentStatusChangeRequest, AvailableSlot, BookAppointmentRequest, CancelAppointmentRequest, DoctorInProgress, DoctorQueuePatient, RescheduleAppointmentRequest, StaffBookAppointmentRequest } from '../types/appointment'

const query = (filters: AppointmentFilters = {}) => {
  const params = new URLSearchParams()
  if (filters.date) params.set('date', filters.date)
  if (filters.status !== undefined && filters.status !== '') params.set('status', String(filters.status))
  const value = params.toString()
  return value ? `?${value}` : ''
}

export const appointmentApi = {
  availableSlots: (doctorId: number, date: string, serviceId?: number) => apiRequest<AvailableSlot[]>(`/appointments/available-slots?doctorId=${doctorId}&date=${date}${serviceId ? `&serviceId=${serviceId}` : ''}`, { skipAuth: true }),
  book: (request: BookAppointmentRequest) => apiRequest<Appointment>('/appointments/book', { method: 'POST', body: JSON.stringify(request) }),
  staffBook: (request: StaffBookAppointmentRequest) => apiRequest<Appointment>('/appointments/staff-book', { method: 'POST', body: JSON.stringify(request) }),
  myAppointments: (filters: AppointmentFilters = {}) => apiRequest<Appointment[]>(`/appointments/my-appointments${query(filters)}`),
  staffAppointments: (filters: AppointmentFilters & { doctorId?: number } = {}, signal?: AbortSignal) => {
    const params = new URLSearchParams()
    if (filters.date) params.set('date', filters.date)
    if (filters.status !== undefined && filters.status !== '') params.set('status', String(filters.status))
    if (filters.doctorId) params.set('doctorId', String(filters.doctorId))
    return apiRequest<Appointment[]>(`/appointments/staff-appointments?${params.toString()}`, { signal })
  },
  waitingQueue: (date: string, doctorId?: number, signal?: AbortSignal) => apiRequest<Appointment[]>(`/appointments/waiting-queue?date=${date}${doctorId ? `&doctorId=${doctorId}` : ''}`, { signal }),
  doctorQueue: (date: string) => apiRequest<DoctorQueuePatient[]>(`/appointments/doctor-queue?date=${date}`),
  doctorInProgress: () => apiRequest<DoctorInProgress[]>('/appointments/doctor-in-progress'),
  checkIn: (id: number, request: AppointmentStatusChangeRequest = {}) => apiRequest<Appointment>(`/appointments/${id}/check-in`, { method: 'PUT', body: JSON.stringify(request) }),
  confirm: (id: number, request: AppointmentStatusChangeRequest = {}) => apiRequest<Appointment>(`/appointments/${id}/confirm`, { method: 'PUT', body: JSON.stringify(request) }),
  noShow: (id: number, request: AppointmentStatusChangeRequest = {}) => apiRequest<Appointment>(`/appointments/${id}/no-show`, { method: 'PUT', body: JSON.stringify(request) }),
  callNext: (date: string, doctorId?: number, request: AppointmentStatusChangeRequest = {}) => apiRequest<Appointment>(`/appointments/call-next?date=${date}${doctorId ? `&doctorId=${doctorId}` : ''}`, { method: 'POST', body: JSON.stringify(request) }),
  moveToEnd: (id: number, request: AppointmentStatusChangeRequest = {}) => apiRequest<Appointment>(`/appointments/${id}/move-to-end`, { method: 'PUT', body: JSON.stringify(request) }),
  getById: (id: number) => apiRequest<Appointment>(`/appointments/${id}`),
  cancel: (id: number, request: CancelAppointmentRequest) => apiRequest<Appointment>(`/appointments/${id}/cancel`, {
    method: 'PUT',
    body: JSON.stringify(request),
  }),
  reschedule: (id: number, request: RescheduleAppointmentRequest) => apiRequest<Appointment>(`/appointments/${id}/reschedule`, {
    method: 'PUT',
    body: JSON.stringify(request),
  }),
  complete: (id: number, request: AppointmentStatusChangeRequest = {}) => apiRequest<Appointment>(`/appointments/${id}/complete`, {
    method: 'PUT',
    body: JSON.stringify(request),
  }),
}
