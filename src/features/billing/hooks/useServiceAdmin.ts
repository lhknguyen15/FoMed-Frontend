import { displayError } from '../../../shared/api/user-messages'
import { useState } from 'react'
import { serviceAdminApi } from '../api/billing-api'
import type { CreateMedicalServiceInput, UpdateMedicalServiceInput } from '../types/billing'

export function useServiceAdmin() {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const execute = async <T,>(operation: () => Promise<T>) => {
    setSubmitting(true)
    setError('')
    try {
      return await operation()
    } catch (reason) {
      setError(displayError(reason, 'Không thể lưu dịch vụ.'))
      throw reason
    } finally {
      setSubmitting(false)
    }
  }

  return {
    submitting,
    error,
    clearError: () => setError(''),
    createService: (request: CreateMedicalServiceInput) => execute(() => serviceAdminApi.create(request)),
    updateService: (id: number, request: UpdateMedicalServiceInput) => execute(() => serviceAdminApi.update(id, request)),
  }
}
