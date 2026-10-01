export type Doctor = {
  doctorId: number
  userId: number
  specialtyId: number
  specialtyName: string
  fullName: string
  title?: string | null
  licenseNumber?: string | null
  phone?: string | null
  room?: string | null
  consultationFee: number
  isActive: boolean
}

export type Specialty = {
  specialtyId: number
  name: string
  description?: string | null
  isActive: boolean
}

export type CreateDoctorInput = {
  username: string
  password: string
  email?: string
  fullName: string
  specialtyId: number
  title?: string
  licenseNumber?: string
  phone?: string
  room?: string
  consultationFee: number
}

export type UpdateDoctorInput = Omit<CreateDoctorInput, 'username' | 'password' | 'email'> & {
  isActive?: boolean
}

export type CreateSpecialtyInput = { name: string; description?: string }
export type UpdateSpecialtyInput = CreateSpecialtyInput & { isActive: boolean }
