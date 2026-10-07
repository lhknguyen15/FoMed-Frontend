import type { ApiResponse } from './api-response'
import { clearStoredSession, getStoredSession, saveStoredSession, type StoredSession } from './token-storage'
import { getUserErrorMessage } from './user-messages'

const API_URL = import.meta.env.VITE_API_URL || '/api'
let refreshPromise: Promise<StoredSession> | null = null

export function refreshStoredSession(): Promise<StoredSession> {
  if (refreshPromise) return refreshPromise

  refreshPromise = (async () => {
    const current = getStoredSession()
    if (!current?.refreshToken) throw new Error('Phiên đăng nhập không tồn tại.')

    let response: Response
    try {
      response = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: current.refreshToken }),
      })
    } catch {
      throw new Error(getUserErrorMessage(null, 0))
    }
    const payload = await response.json().catch(() => null) as ApiResponse<{
      accessToken: string
      refreshToken: string
      expiresIn: number
      user: StoredSession['user']
    } | null> | null

    if (!response.ok || !payload?.dataResponse) {
      clearStoredSession()
      throw new Error(response.ok ? 'Không thể tiếp tục phiên đăng nhập. Vui lòng đăng nhập lại.' : getUserErrorMessage(payload, response.status))
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
