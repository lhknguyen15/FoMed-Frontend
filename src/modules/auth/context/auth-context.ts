import { createContext } from 'react'
import type { SessionUser } from '../../../shared/api/token-storage'
import type { LoginRequest, RegisterPatientRequest } from '../types/auth.types'

export type AuthContextValue = {
  user: SessionUser | null
  isAuthenticated: boolean
  isReady: boolean
  login: (request: LoginRequest, remember: boolean) => Promise<SessionUser>
  register: (request: RegisterPatientRequest) => Promise<SessionUser>
  forgotPassword: (email: string) => Promise<string>
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
