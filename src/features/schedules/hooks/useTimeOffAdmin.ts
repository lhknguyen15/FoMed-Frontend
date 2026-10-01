import { useState } from 'react'
import { scheduleAdminApi, type SaveDoctorTimeOffInput } from '../api/schedule-api'

export function useTimeOffAdmin() {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const execute = async <T,>(operation: () => Promise<T>) => {
    setSubmitting(true)
    setError('')
    try {
      return await operation()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không thể lưu lịch nghỉ.')
      throw reason
    } finally {
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
