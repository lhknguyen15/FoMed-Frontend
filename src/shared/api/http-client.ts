import { ApiError } from './api-error'
import type { ApiResponse } from './api-response'
import { refreshStoredSession } from './refresh-token'
import { getStoredSession } from './token-storage'

const API_URL = import.meta.env.VITE_API_URL || '/api'

type RequestOptions = RequestInit & { skipAuth?: boolean; retryAuth?: boolean }
type ErrorPayload = { message?: string; title?: string; errors?: Record<string, string[]> }

function getErrorMessage(payload: ErrorPayload | null) {
  if (payload?.message) return payload.message
  const validationMessage = payload?.errors && Object.values(payload.errors).flat()[0]
  return validationMessage || payload?.title || 'Yêu cầu không thể thực hiện.'
}

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
    throw new ApiError('Không thể kết nối đến FoMed API. Vui lòng kiểm tra backend.', 0)
  }

  if (response.status === 401 && !skipAuth && retryAuth && session?.refreshToken) {
    await refreshStoredSession()
    return apiRequestResult<T>(path, { ...options, retryAuth: false })
  }

  const payload = await response.json().catch(() => null) as (ApiResponse<T> & ErrorPayload) | null
  if (!response.ok) {
    throw new ApiError(getErrorMessage(payload), response.status, payload)
  }
  if (!payload) throw new ApiError('Phản hồi từ máy chủ không hợp lệ.', response.status)
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
