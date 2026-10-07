import { apiRequest, apiRequestResult } from '../../../shared/api/http-client'
import type { AdminRole, AdminUser, AdminUserPage, AuthResponse, LoginRequest, RegisterPatientRequest, UserProfile } from '../types/auth'

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
    await apiRequestResult<null>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
      skipAuth: true,
    })
    return 'Nếu email đã được đăng ký, hướng dẫn khôi phục mật khẩu sẽ được gửi đến bạn. Vui lòng kiểm tra hộp thư và thư rác.'
  },

  changePassword: async (request: { oldPassword: string; newPassword: string; confirmPassword: string }) => {
    await apiRequestResult<string | null>('/profile/change-password', {
      method: 'PUT',
      body: JSON.stringify(request),
    })
    return 'Đã đổi mật khẩu thành công.'
  },

  adminUsers: (filters: { search?: string; role?: string; isActive?: boolean; page?: number; pageSize?: number } = {}) => {
    const params = new URLSearchParams({ page: String(filters.page ?? 1), pageSize: String(filters.pageSize ?? 20) })
    if (filters.search) params.set('search', filters.search)
    if (filters.role) params.set('role', filters.role)
    if (filters.isActive !== undefined) params.set('isActive', String(filters.isActive))
    return apiRequest<AdminUserPage>(`/admin/users?${params}`)
  },

  getProfile: () => apiRequest<UserProfile>('/profile'),

  updateProfile: (request: { fullName: string; phone?: string }) => apiRequest<UserProfile>('/profile', {
    method: 'PUT',
    body: JSON.stringify(request),
  }),

  adminRoles: () => apiRequest<AdminRole[]>('/admin/roles'),

  updateAdminUserStatus: (userId: number, isActive: boolean) => apiRequest<AdminUser>(`/admin/users/${userId}/status`, {
    method: 'PUT',
    body: JSON.stringify({ isActive }),
  }),

  updateAdminUserRoles: (userId: number, roles: string[]) => apiRequest<AdminUser>(`/admin/users/${userId}/roles`, {
    method: 'PUT',
    body: JSON.stringify({ roles }),
  }),

  resetAdminUserPassword: (userId: number, newPassword: string) => apiRequest<null>(`/admin/users/${userId}/reset-password`, {
    method: 'POST',
    body: JSON.stringify({ newPassword }),
  }),
}
