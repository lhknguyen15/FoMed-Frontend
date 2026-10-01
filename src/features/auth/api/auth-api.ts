import { apiRequest, apiRequestResult } from '../../../shared/api/http-client'
import type { AdminRole, AdminUserPage, AuthResponse, LoginRequest, RegisterPatientRequest } from '../types/auth'

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

  adminUsers: (filters: { search?: string; page?: number; pageSize?: number } = {}) => {
    const params = new URLSearchParams({ page: String(filters.page ?? 1), pageSize: String(filters.pageSize ?? 20) })
    if (filters.search) params.set('search', filters.search)
    return apiRequest<AdminUserPage>(`/admin/users?${params}`)
  },

  adminRoles: () => apiRequest<AdminRole[]>('/admin/roles'),
}
