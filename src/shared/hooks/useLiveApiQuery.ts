import { useCallback, useEffect, useRef, useState } from 'react'
import { ApiError } from '../api/api-error'
import { displayError } from '../api/user-messages'

type Snapshot<T> = { key: string; data: T | null; loading: boolean; refreshing: boolean; error: string; updatedAt: number | null }
const interval = 15_000

// Opt-in read-only polling. Keep forms/selections outside this hook; never retry a mutation.
export function useLiveApiQuery<T>(key: string, query: (signal: AbortSignal) => Promise<T>, paused = false) {
  const queryRef = useRef(query)
  const pausedRef = useRef(paused)
  queryRef.current = query
  pausedRef.current = paused
  const [state, setState] = useState<Snapshot<T>>({ key, data: null, loading: true, refreshing: false, error: '', updatedAt: null })
  const controls = useRef({ refresh: () => {}, pause: () => {}, resume: () => {} })
  const refresh = useCallback(() => controls.current.refresh(), [])

  useEffect(() => {
    let active = true
    let request: AbortController | null = null
    let timer: ReturnType<typeof setTimeout> | undefined
    let previous: T | null = null
    let updatedAt: number | null = null
    let failures = 0
    let queuedRefresh = false
    let wait = interval
    let retryAt = 0
    let limitedUntil = 0
    const visible = () => document.visibilityState === 'visible'
    const schedule = () => {
      clearTimeout(timer)
      if (active && visible() && !pausedRef.current && failures < 3) timer = setTimeout(() => void load(false), retryAt > Date.now() ? retryAt - Date.now() : wait)
    }
    const load = async (manual: boolean) => {
      if (!active || (!manual && (!visible() || pausedRef.current || failures >= 3))) return
      if (Date.now() < limitedUntil) { schedule(); return }
      if (!manual && Date.now() < retryAt) { schedule(); return }
      if (request) { if (manual) queuedRefresh = true; return }
      clearTimeout(timer)
      const controller = new AbortController()
      request = controller
      setState({ key, data: previous, loading: previous === null, refreshing: previous !== null, error: '', updatedAt })
      try {
        const data = await queryRef.current(controller.signal)
        if (!active || controller.signal.aborted) return
        previous = data
        updatedAt = Date.now()
        failures = 0
        wait = interval
        retryAt = 0
        limitedUntil = 0
        setState({ key, data, loading: false, refreshing: false, error: '', updatedAt })
      } catch (reason) {
        if (!active || controller.signal.aborted) return
        failures++
        if (reason instanceof ApiError && (reason.status === 401 || reason.status === 403)) failures = 3
        wait = interval * 2 ** failures
        if (reason instanceof ApiError && reason.status === 429) {
          const seconds = reason.retryAfterSeconds
          limitedUntil = Date.now() + (Number.isInteger(seconds) && seconds! >= 1 && seconds! <= 86400 ? seconds! : 60) * 1000
          wait = Math.max(wait, limitedUntil - Date.now())
        }
        retryAt = Date.now() + wait
        // Do not leave stale patient actions or a false empty state available after a failed read.
        previous = null
        updatedAt = null
        setState({ key, data: null, loading: false, refreshing: false, error: displayError(reason, 'Không thể cập nhật danh sách. Vui lòng thử lại.'), updatedAt: null })
      } finally {
        if (request === controller) request = null
        if (active) {
          if (queuedRefresh) { queuedRefresh = false; controls.current.refresh() }
          else schedule()
        }
      }
    }
    const resume = () => { if (visible() && !pausedRef.current && failures < 3) void load(false) }
    const visibility = () => { if (visible()) resume(); else clearTimeout(timer) }
    controls.current = {
      refresh: () => { if (Date.now() < limitedUntil) { schedule(); return }; failures = 0; retryAt = 0; void load(true) },
      pause: () => { clearTimeout(timer) },
      resume,
    }
    document.addEventListener('visibilitychange', visibility)
    window.addEventListener('focus', resume)
    if (visible() && !pausedRef.current) void load(false)
    return () => {
      active = false
      queuedRefresh = false
      clearTimeout(timer)
      request?.abort()
      controls.current = { refresh: () => {}, pause: () => {}, resume: () => {} }
      document.removeEventListener('visibilitychange', visibility)
      window.removeEventListener('focus', resume)
    }
  }, [key])
  useEffect(() => { if (paused) controls.current.pause(); else controls.current.resume() }, [paused])
  const current = state.key === key ? state : { key, data: null, loading: true, refreshing: false, error: '', updatedAt: null }
  return { ...current, refresh }
}
