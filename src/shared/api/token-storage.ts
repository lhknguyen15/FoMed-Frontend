export type SessionUser = {
  id: number
  fullName: string
  roles: string[]
  doctorId: number | null
  patientId: number | null
}

export type StoredSession = {
  accessToken: string
  refreshToken: string
  expiresAt: number
  user: SessionUser
  remember: boolean
}

const SESSION_KEY = 'fomed_session'

function parse(value: string | null): StoredSession | null {
  if (!value) return null
  try {
    return JSON.parse(value) as StoredSession
  } catch {
    return null
  }
}

export function getStoredSession(): StoredSession | null {
  return parse(localStorage.getItem(SESSION_KEY)) ?? parse(sessionStorage.getItem(SESSION_KEY))
}

export function saveStoredSession(session: StoredSession) {
  clearStoredSession()
  const storage = session.remember ? localStorage : sessionStorage
  storage.setItem(SESSION_KEY, JSON.stringify(session))
}

export function clearStoredSession() {
  localStorage.removeItem(SESSION_KEY)
  sessionStorage.removeItem(SESSION_KEY)
}
