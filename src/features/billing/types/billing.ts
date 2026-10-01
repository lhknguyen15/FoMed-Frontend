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

export type CreateMedicalServiceInput = {
  code?: string
  name: string
  description?: string
  price: number
  specialtyId?: number
  durationMinutes: number
}

export type UpdateMedicalServiceInput = CreateMedicalServiceInput & {
  isActive: boolean
}
