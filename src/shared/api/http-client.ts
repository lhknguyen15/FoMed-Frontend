import { ApiError } from './api-error'
import type { ApiResponse } from './api-response'
import { refreshStoredSession } from './refresh-token'
import { getStoredSession } from './token-storage'
import { getUserErrorMessage } from './user-messages'
import { rateLimitMessage, retryAfterSeconds } from './rate-limit'

const API_URL = import.meta.env.VITE_API_URL || '/api'

type RequestOptions = RequestInit & { skipAuth?: boolean; retryAuth?: boolean }
type ErrorPayload = { message?: string; title?: string; errors?: Record<string, string[]> }

export async function apiRequestResult<T>(path: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
  const { skipAuth = false, retryAuth = true, ...init } = options
  const session = getStoredSession()
  const headers = new Headers(init.headers)
  if (init.body && !(init.body instanceof FormData)) headers.set('Content-Type', 'application/json')
  if (!skipAuth && session?.accessToken) headers.set('Authorization', `Bearer ${session.accessToken}`)

  let response: Response
  try {
    response = await fetch(`${API_URL}${path}`, { ...init, headers })
  } catch {
    throw new ApiError('Không thể kết nối đến hệ thống. Vui lòng kiểm tra kết nối mạng và thử lại.', 0)
  }

  if (response.status === 401 && !skipAuth && retryAuth && session?.refreshToken) {
    await refreshStoredSession()
    return apiRequestResult<T>(path, { ...options, retryAuth: false })
  }

  if (response.status === 204) {
    return { dataResponse: null, message: '', statusCode: response.status } as ApiResponse<T>
  }

  const payload = await response.json().catch(() => null) as (ApiResponse<T> & ErrorPayload) | null
  if (!response.ok) {
    const wait = response.status === 429 ? retryAfterSeconds(response.headers.get('Retry-After'), payload) : undefined
    throw new ApiError(response.status === 429 ? rateLimitMessage(wait) : getUserErrorMessage(payload, response.status), response.status, payload, wait)
  }
  if (!payload) throw new ApiError('Không thể tải thông tin lúc này. Vui lòng thử lại.', response.status)
  return payload
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const payload = await apiRequestResult<T>(path, options) as unknown
  if (payload && typeof payload === 'object' && 'dataResponse' in payload) {
    return (payload as ApiResponse<T>).dataResponse
  }

  // Một số endpoint cũ của FoMed API (reports, audit logs, time-off) trả
  // payload trực tiếp thay vì HTTPResponseData. Giữ adapter ở hạ tầng để
  // các module không phải tự xử lý hai kiểu response.
  return payload as T
}

export async function apiDownload(path: string, options: RequestOptions = {}): Promise<{ blob: Blob; fileName?: string }> {
  const { skipAuth = false, retryAuth = true, ...init } = options
  const session = getStoredSession()
  const headers = new Headers(init.headers)
  if (!skipAuth && session?.accessToken) headers.set('Authorization', `Bearer ${session.accessToken}`)

  let response: Response
  try {
    response = await fetch(`${API_URL}${path}`, { ...init, headers })
  } catch {
    throw new ApiError('Không thể kết nối đến hệ thống. Vui lòng kiểm tra kết nối mạng và thử lại.', 0)
  }
  if (response.status === 401 && !skipAuth && retryAuth && session?.refreshToken) {
    await refreshStoredSession()
    return apiDownload(path, { ...options, retryAuth: false })
  }
  if (!response.ok) {
    const payload = await response.json().catch(() => null) as ErrorPayload | null
    const wait = response.status === 429 ? retryAfterSeconds(response.headers.get('Retry-After'), payload) : undefined
    throw new ApiError(response.status === 429 ? rateLimitMessage(wait) : getUserErrorMessage(payload, response.status), response.status, payload, wait)
  }
  const disposition = response.headers.get('content-disposition') ?? ''
  // Prefer RFC 5987 UTF-8 names; ASP.NET also emits an ASCII fallback before filename*.
  const encoded = disposition.match(/filename\*\s*=\s*UTF-8''([^;]+)/i)?.[1]
  const plain = disposition.match(/filename\s*=\s*(?:"((?:\\.|[^"])*)"|([^;]+))/i)
  let fileName = (plain?.[1] ?? plain?.[2])?.trim().replace(/\\(["\\])/g, '$1')
  if (encoded) { try { fileName = decodeURIComponent(encoded.trim()) } catch { /* Retain safe fallback for malformed headers. */ } }
  fileName = fileName?.split(/[/\\]/).pop()?.split('').filter(character => character.charCodeAt(0) >= 32 && character.charCodeAt(0) !== 127).join('')
  return { blob: await response.blob(), fileName }
}
