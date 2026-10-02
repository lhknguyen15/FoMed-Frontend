export type Patient = {
  patientId: number
  userId?: number | null
  patientCode: string
  fullName: string
  gender?: number | null
  dateOfBirth?: string | null
  phone?: string | null
  address?: string | null
  nationalId?: string | null
  insuranceNumber?: string | null
  emergencyContactName?: string | null
  emergencyContactPhone?: string | null
  allergies?: string | null
  isActive: boolean
}

export type PatientSearchFilters = { phone?: string; name?: string; patientCode?: string; page?: number; pageSize?: number }
export type PatientHistory = { appointmentId: number; appointmentCode: string; startTime: string; status: number; statusName: string; doctorId: number; doctorName: string; serviceId?: number | null; serviceName?: string | null; medicalRecordId?: number | null; diagnosis?: string | null }
