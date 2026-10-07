import { useCallback, useEffect, useRef, useState } from 'react'
import { clinicalApi } from '../api/clinical-api'
import type { ServiceOrder } from '../types/clinical'
import { displayError } from '../../../shared/api/user-messages'
import { notify } from '../../../shared/notifications/notify'

type Snapshot = { recordId: number; data: ServiceOrder[] | null; loading: boolean; error: string; updatedAt: number | null }

// Only refresh orders: refreshing the record/prescription would overwrite unsaved drafts.
export function useRecordServiceOrders(recordId: number) {
  const [state, setState] = useState<Snapshot>({ recordId, data: null, loading: true, error: '', updatedAt: null })
  const reload = useRef<() => void>(() => {})
  const refresh = useCallback(() => reload.current(), [])
  useEffect(() => {
    let active = true
    let controller: AbortController | null = null
    let timer: ReturnType<typeof setTimeout> | undefined
    let previous: ServiceOrder[] | null = null
    let failures = 0
    const valid = Number.isSafeInteger(recordId) && recordId > 0
    const schedule = () => {
      clearTimeout(timer)
      if (active && failures < 3 && previous?.some(order => order.status === 0) && document.visibilityState === 'visible') {
        timer = setTimeout(() => void load(), 30_000 * 2 ** failures)
      }
    }
    const load = async () => {
      if (!valid || !active) return
      clearTimeout(timer)
      controller?.abort()
      const request = new AbortController()
      controller = request
      setState({ recordId, data: previous, loading: true, error: '', updatedAt: null })
      try {
        const data = await clinicalApi.serviceOrders(recordId, request.signal)
        if (!active || request.signal.aborted) return
        if (!Array.isArray(data) || data.some(order => order.medicalRecordId !== recordId)) throw new Error('Không thể xác định kết quả của bệnh án. Vui lòng tải lại.')
        if (previous && data.some(order => order.status === 1 && previous!.some(old => old.id === order.id && old.status === 0))) {
          notify.success('Đã có kết quả chỉ định mới. Vui lòng xem trước khi kê đơn.', `service-results-${recordId}`)
        }
        previous = data
        failures = 0
        setState({ recordId, data, loading: false, error: '', updatedAt: Date.now() })
      } catch (error) {
        if (!active || request.signal.aborted) return
        failures++
        setState({ recordId, data: null, loading: false, error: displayError(error, 'Không thể tải kết quả chỉ định. Vui lòng thử lại.'), updatedAt: null })
      } finally {
        if (active && !request.signal.aborted) schedule()
      }
    }
    reload.current = () => { failures = 0; void load() }
    const resume = () => { if (document.visibilityState === 'visible' && previous?.some(order => order.status === 0) && failures < 3) void load() }
    const visibility = () => { if (document.visibilityState === 'hidden') clearTimeout(timer); else resume() }
    document.addEventListener('visibilitychange', visibility)
    window.addEventListener('focus', resume)
    if (valid) void load()
    else setState({ recordId, data: null, loading: false, error: 'Bệnh án không hợp lệ.', updatedAt: null })
    return () => { active = false; clearTimeout(timer); controller?.abort(); reload.current = () => {}; document.removeEventListener('visibilitychange', visibility); window.removeEventListener('focus', resume) }
  }, [recordId])
  const current = Object.is(state.recordId, recordId) ? state : { recordId, data: null, loading: true, error: '', updatedAt: null }
  return { ...current, refresh }
}
