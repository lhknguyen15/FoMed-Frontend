import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { authApi } from '../api/auth-api'
import {
  clearStoredSession,
  getStoredSession,
  saveStoredSession,
  type SessionUser,
} from '../../../shared/api/token-storage'
import { refreshStoredSession } from '../../../shared/api/refresh-token'
import { AuthContext, type AuthContextValue } from './auth-context'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    const restore = async () => {
      const session = getStoredSession()
      if (!session) {
        setIsReady(true)
        return
      }

      try {
        const activeSession = session.expiresAt > Date.now() + 30_000
          ? session
          : await refreshStoredSession()
        setUser(activeSession.user)
      } catch {
        clearStoredSession()
      } finally {
        setIsReady(true)
      }
    }
    void restore()
  }, [])

  const value = useMemo<AuthContextValue>(() => ({
    user,
    isAuthenticated: Boolean(user),
    isReady,
    login: async (request, remember) => {
      const response = await authApi.login(request)
      saveStoredSession({
        ...response,
        expiresAt: Date.now() + response.expiresIn * 1000,
        remember,
      })
      setUser(response.user)
      return response.user
    },
    register: async (request) => {
      const response = await authApi.register(request)
      saveStoredSession({
        ...response,
        expiresAt: Date.now() + response.expiresIn * 1000,
        remember: true,
      })
      setUser(response.user)
      return response.user
    },
    forgotPassword: authApi.forgotPassword,
    logout: () => {
      clearStoredSession()
      setUser(null)
    },
  }), [isReady, user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
