import type { SessionUser } from '../../../shared/api/token-storage'

export type LoginRequest = {
  username: string
  password: string
}

export type RegisterPatientRequest = {
  fullName: string
  phone: string
  email?: string
  dateOfBirth?: string
  password: string
}

export type AuthResponse = {
  accessToken: string
  refreshToken: string
  expiresIn: number
  user: SessionUser
}

export type AdminUser = {
  userId: number
  username: string
  email?: string | null
  fullName?: string | null
  phone?: string | null
  isActive: boolean
  createdAt: string
  roles: string[]
  doctorId?: number | null
  patientId?: number | null
}

export type AdminRole = { roleId: number; name: string; userCount: number }
export type AdminUserPage = { items: AdminUser[]; total: number; page: number; pageSize: number }
