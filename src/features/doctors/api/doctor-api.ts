import { apiRequest } from '../../../shared/api/http-client'
import type { CreateDoctorInput, CreateSpecialtyInput, Doctor, Specialty, UpdateDoctorInput, UpdateSpecialtyInput } from '../types/doctor'

export const doctorProfileApi = {
  me: () => apiRequest<Doctor>('/doctor/me'),
  update: (request: Omit<UpdateDoctorInput, 'isActive'>) => apiRequest<Doctor>('/doctor/me', {
    method: 'PUT', body: JSON.stringify(request),
  }),
}

export const doctorAdminApi = {
  list: () => apiRequest<Doctor[]>('/admin/doctors'),
  specialties: async () => {
    const [all, active] = await Promise.all([
      apiRequest<Omit<Specialty, 'isActive'>[]>('/admin/specialties'),
      apiRequest<Omit<Specialty, 'isActive'>[]>('/specialties'),
    ])
    const activeIds = new Set(active.map((item) => item.specialtyId))
    return all.map((item) => ({ ...item, isActive: activeIds.has(item.specialtyId) }))
  },
  create: (request: CreateDoctorInput) => apiRequest<Doctor>('/admin/doctors', {
    method: 'POST',
    body: JSON.stringify(request),
  }),
  update: (doctorId: number, request: UpdateDoctorInput) => apiRequest<Doctor>(`/admin/doctors/${doctorId}`, {
    method: 'PUT',
    body: JSON.stringify(request),
  }),
  createSpecialty: (request: CreateSpecialtyInput) => apiRequest<Specialty>('/admin/specialties', {
    method: 'POST',
    body: JSON.stringify(request),
  }),
  updateSpecialty: (specialtyId: number, request: UpdateSpecialtyInput) => apiRequest<Specialty>(`/admin/specialties/${specialtyId}`, {
    method: 'PUT',
    body: JSON.stringify(request),
  }),
}
