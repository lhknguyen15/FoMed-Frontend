import { useState } from 'react'
import { authApi } from '../api/auth-api'

export function useAdminUserMutations() {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const execute = async <T,>(operation: () => Promise<T>) => {
    setSubmitting(true)
    setError('')
    try {
      return await operation()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không thể cập nhật người dùng.')
      throw reason
    } finally {
      setSubmitting(false)
    }
  }

  return {
    submitting,
    error,
    clearError: () => setError(''),
    updateStatus: (userId: number, isActive: boolean) => execute(() => authApi.updateAdminUserStatus(userId, isActive)),
    updateRoles: (userId: number, roles: string[]) => execute(() => authApi.updateAdminUserRoles(userId, roles)),
    resetPassword: (userId: number, newPassword: string) => execute(() => authApi.resetAdminUserPassword(userId, newPassword)),
  }
}
