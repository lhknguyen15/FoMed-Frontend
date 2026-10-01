export type MedicalService = {
  serviceId: number
  code?: string | null
  name: string
  description?: string | null
  price: number
  specialtyId?: number | null
  specialtyName?: string | null
  durationMinutes: number
  isActive: boolean
}
