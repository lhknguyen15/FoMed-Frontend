export type PublicDoctor = {
  doctorId: number
  specialtyId: number
  specialtyName: string
  fullName: string
  title?: string | null
  consultationFee: number
  avatarUrl?: string | null
}

export type CatalogSpecialty = { specialtyId: number; name: string; description?: string | null }
export type PublicDoctorDetail = PublicDoctor & {
  room: string | null
  avatarUrl: string | null
  biography: string | null
  practiceStartYear: number | null
  specialtyDescription: string | null
}
export type CatalogService = { id: number; name: string; price: number }
