import { useState } from 'react'
import { doctorAdminApi } from '../api/doctor-api'
import type { CreateDoctorInput, CreateSpecialtyInput, UpdateDoctorInput, UpdateSpecialtyInput } from '../types/doctor'

export function useDoctorAdmin() {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const execute = async <T,>(operation: () => Promise<T>) => {
    setSubmitting(true)
    setError('')
    try {
      return await operation()
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : 'Không thể lưu dữ liệu.'
      setError(message)
      throw reason
    } finally {
      setSubmitting(false)
    }
  }

  return {
    submitting,
    error,
    clearError: () => setError(''),
    createDoctor: (request: CreateDoctorInput) => execute(() => doctorAdminApi.create(request)),
    updateDoctor: (id: number, request: UpdateDoctorInput) => execute(() => doctorAdminApi.update(id, request)),
    createSpecialty: (request: CreateSpecialtyInput) => execute(() => doctorAdminApi.createSpecialty(request)),
    updateSpecialty: (id: number, request: UpdateSpecialtyInput) => execute(() => doctorAdminApi.updateSpecialty(id, request)),
  }
}
