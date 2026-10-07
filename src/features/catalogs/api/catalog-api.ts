import { apiRequest } from '../../../shared/api/http-client'
import type { CatalogService, CatalogSpecialty, PublicDoctor, PublicDoctorDetail } from '../types/catalog'

export const catalogApi = {
  doctor: (doctorId: number) => apiRequest<PublicDoctorDetail>(`/doctors/${doctorId}`, { skipAuth: true }),
  doctors: (specialtyId?: number, search?: string) => {
    const query = new URLSearchParams()
    if (specialtyId) query.set('specialtyId', String(specialtyId))
    if (search?.trim()) query.set('search', search.trim())
    const suffix = query.size ? `?${query.toString()}` : ''
    return apiRequest<PublicDoctor[]>(`/doctors${suffix}`, { skipAuth: true })
  },
  specialties: () => apiRequest<CatalogSpecialty[]>('/specialties', { skipAuth: true }),
  services: (page = 1) => apiRequest<CatalogService[]>(`/services?page=${page}`, { skipAuth: true }),
}
