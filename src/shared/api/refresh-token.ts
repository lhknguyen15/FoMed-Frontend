import type { ApiResponse } from './api-response'
import { clearStoredSession, getStoredSession, saveStoredSession, type StoredSession } from './token-storage'

const API_URL = import.meta.env.VITE_API_URL || '/api'
let refreshPromise: Promise<StoredSession> | null = null

export function refreshStoredSession(): Promise<StoredSession> {
  if (refreshPromise) return refreshPromise

  refreshPromise = (async () => {
    const current = getStoredSession()
    if (!current?.refreshToken) throw new Error('Phiên đăng nhập không tồn tại.')

    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: current.refreshToken }),
    })
    const payload = await response.json() as ApiResponse<{
      accessToken: string
      refreshToken: string
      expiresIn: number
      user: StoredSession['user']
    } | null>

    if (!response.ok || !payload.dataResponse) {
      clearStoredSession()
      throw new Error(payload.message || 'Phiên đăng nhập đã hết hạn.')
    }

    const next: StoredSession = {
      ...payload.dataResponse,
      expiresAt: Date.now() + payload.dataResponse.expiresIn * 1000,
      remember: current.remember,
    }
    saveStoredSession(next)
    return next
  })().finally(() => {
    refreshPromise = null
  })

  return refreshPromise
}
