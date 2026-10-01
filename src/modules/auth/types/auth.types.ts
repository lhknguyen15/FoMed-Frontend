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
