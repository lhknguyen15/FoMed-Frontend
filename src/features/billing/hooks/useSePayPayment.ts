import { displayError } from '../../../shared/api/user-messages'
import { useEffect, useRef, useState } from 'react'
import { invoiceApi } from '../api/billing-api'
import { validateSePayRequest } from '../schemas/sepay-schema'
import type { SePayPaymentRequest } from '../types/billing'

export function useSePayPayment(initial: SePayPaymentRequest, onTerminal: (request: SePayPaymentRequest) => void) {
  const [request, setRequest] = useState(initial)
  const [error, setError] = useState('')
  const [checking, setChecking] = useState(false)
  const [revision, setRevision] = useState(0)
  const callback = useRef(onTerminal)
  const notified = useRef(false)
  callback.current = onTerminal
  useEffect(() => {
    let alive = true
    let timer: ReturnType<typeof setTimeout> | undefined
    let controller: AbortController | undefined
    const terminal = (value: SePayPaymentRequest) => {
      if (value.status !== 'Pending' && !notified.current) {
        notified.current = true
        callback.current(value)
      }
    }
    const check = async () => {
      controller = new AbortController()
      const timeout = setTimeout(() => controller?.abort(), 15000)
      setChecking(true)
      try {
        const value = validateSePayRequest(await invoiceApi.getSePayRequest(initial.invoiceId, initial.id, controller.signal), initial.invoiceId, initial.id)
        if (value.amount !== initial.amount || value.code !== initial.code || value.environment !== initial.environment
          || value.bankCode !== initial.bankCode || value.accountNumber !== initial.accountNumber || value.accountName !== initial.accountName
          || value.expiresAt !== initial.expiresAt) throw new Error('Thông tin yêu cầu thanh toán đã thay đổi bất thường. Không chuyển hoặc thu lại tiền; cần đối soát.')
        if (!alive) return
        setRequest(value); setError(''); terminal(value)
        if (value.status === 'Pending') timer = setTimeout(() => void check(), 3000)
      } catch (reason) {
        if (alive) setError(displayError(reason, 'Không kiểm tra được thanh toán. Chưa thể xác nhận đã thu tiền.'))
        // Stop on errors; an explicit retry is GET-only, never a new payment request.
      } finally { clearTimeout(timeout); if (alive) setChecking(false) }
    }
    if (initial.status === 'Pending') void check()
    else terminal(initial)
    return () => { alive = false; clearTimeout(timer); controller?.abort() }
    // The parent's initial request is stable for the lifetime of a keyed modal.
  }, [initial, revision])
  return { request, error, checking, retry: () => setRevision(value => value + 1) }
}
