import type { ServiceOrder } from '../../../features/clinical/types/clinical'

const STORAGE_KEY = 'fomed-technician-results-session'

export function readTechnicianResults() {
  try {
    const value = sessionStorage.getItem(STORAGE_KEY)
    return value ? JSON.parse(value) as ServiceOrder[] : []
  } catch {
    return []
  }
}

export function rememberTechnicianResult(result: ServiceOrder) {
  const existing = readTechnicianResults().filter((item) => item.id !== result.id)
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify([result, ...existing].slice(0, 50)))
}

export function clearTechnicianResults() {
  sessionStorage.removeItem(STORAGE_KEY)
}
