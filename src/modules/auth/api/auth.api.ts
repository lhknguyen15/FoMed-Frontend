import { apiRequest, apiRequestResult } from '../../../shared/api/http-client'
import type { AuthResponse, LoginRequest, RegisterPatientRequest } from '../types/auth.types'

export const authApi = {
  login: (request: LoginRequest) => apiRequest<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(request),
    skipAuth: true,
  }),

  register: (request: RegisterPatientRequest) => apiRequest<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(request),
    skipAuth: true,
  }),

  forgotPassword: async (email: string) => {
    const result = await apiRequestResult<null>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
      skipAuth: true,
    })
    return result.message
  },

  changePassword: async (request: { oldPassword: string; newPassword: string; confirmPassword: string }) => {
    const result = await apiRequestResult<string | null>('/profile/change-password', {
      method: 'PUT',
      body: JSON.stringify(request),
    })
    return result.message
  },
}
