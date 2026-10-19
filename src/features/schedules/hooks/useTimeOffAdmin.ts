import { displayError } from '../../../shared/api/user-messages'
import { useRef, useState } from 'react'
import { scheduleAdminApi, type SaveDoctorTimeOffInput } from '../api/schedule-api'

export function useTimeOffAdmin() {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const pending = useRef(false)

  const execute = async <T,>(operation: () => Promise<T>) => {
    if (pending.current) throw new Error('Đang xử lý lịch nghỉ. Vui lòng chờ hoàn tất.')
    pending.current = true
    setSubmitting(true)
    setError('')
    try {
      return await operation()
    } catch (reason) {
      setError(displayError(reason, 'Không thể lưu lịch nghỉ.'))
      throw reason
    } finally {
      pending.current = false
      setSubmitting(false)
    }
  }

  return {
    submitting,
    error,
    clearError: () => setError(''),
    create: (request: SaveDoctorTimeOffInput) => execute(() => scheduleAdminApi.createTimeOff(request)),
    update: (id: number, request: SaveDoctorTimeOffInput) => execute(() => scheduleAdminApi.updateTimeOff(id, request)),
    remove: (id: number) => execute(() => scheduleAdminApi.deleteTimeOff(id)),
  }
}
