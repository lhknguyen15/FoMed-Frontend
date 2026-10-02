export type PublicDoctor = {
  doctorId: number
  specialtyId: number
  specialtyName: string
  fullName: string
  title?: string | null
  room?: string | null
  consultationFee: number
}

export type CatalogSpecialty = { specialtyId: number; name: string; description?: string | null }
export type CatalogService = { id: number; name: string; price: number }
