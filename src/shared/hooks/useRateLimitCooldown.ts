import { useEffect, useRef, useState } from 'react'
import { ApiError } from '../api/api-error'

export function useRateLimitCooldown() {
  const deadline = useRef(0)
  const [secondsLeft, setSecondsLeft] = useState(0)
  const active = secondsLeft > 0
  useEffect(() => {
    if (!active) return
    const timer = window.setInterval(() => setSecondsLeft(Math.max(0, Math.ceil((deadline.current - Date.now()) / 1000))), 1000)
    return () => window.clearInterval(timer)
  }, [active])

  const start = (reason: unknown) => {
    if (!(reason instanceof ApiError) || reason.status !== 429) return false
    const seconds = Number.isInteger(reason.retryAfterSeconds) && reason.retryAfterSeconds! >= 1 && reason.retryAfterSeconds! <= 86400 ? reason.retryAfterSeconds! : 60
    deadline.current = Date.now() + seconds * 1000
    setSecondsLeft(seconds)
    return true
  }
  return { secondsLeft, start, isBlocked: () => Date.now() < deadline.current }
}
