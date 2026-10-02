import { apiRequest } from '../../../shared/api/http-client'
import type { CatalogService, CatalogSpecialty, PublicDoctor } from '../types/catalog'

export const catalogApi = {
  doctors: (specialtyId?: number) => apiRequest<PublicDoctor[]>(specialtyId ? `/doctors?specialtyId=${specialtyId}` : '/doctors'),
  specialties: () => apiRequest<CatalogSpecialty[]>('/specialties'),
  services: () => apiRequest<CatalogService[]>('/services?page=1'),
}
