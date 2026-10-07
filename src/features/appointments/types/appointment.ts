export type AppointmentStatus = 0 | 1 | 2 | 3 | 4 | 5

export type Appointment = {
  id: number
  appointmentCode: string
  patientId: number
  patientName: string
  patientPhone?: string | null
  doctorId: number
  doctorName: string
  doctorSpecialty: string
  doctorRoom?: string | null
  startTime: string
  endTime: string
  status: AppointmentStatus | number
  statusName: string
  reason?: string | null
  queueNumber?: number | null
  createdAt: string
  serviceId?: number | null
  serviceName?: string | null
  checkedInAt?: string | null
  source: number
  feeSnapshot?: number | null
}

export type AvailableSlot = { startTime: string; endTime: string; isAvailable: boolean; unavailableReason?: string | null }

export type AppointmentFilters = {
  date?: string
  status?: AppointmentStatus | ''
}

export type BookAppointmentRequest = {
  doctorId: number
  startTime: string
  serviceId?: number
  reason?: string
}

export type CancelAppointmentRequest = { reason: string }
export type RescheduleAppointmentRequest = { startTime: string; reason?: string }
export type StaffBookAppointmentRequest = { patientId: number; doctorId: number; startTime: string; serviceId?: number; source: 1 | 2; reason?: string }
export type AppointmentStatusChangeRequest = { reason?: string }

export type PatientHistorySummary = {
  medicalRecordId: number
  appointmentId: number
  visitAt: string
  diagnosis?: string | null
  note?: string | null
}

export type DoctorQueuePatient = {
  appointment: Appointment
  allergies?: string | null
  recentHistory: PatientHistorySummary[]
}

export type DoctorInProgress = {
  appointment: Appointment
  medicalRecordId: number
  startedAt: string
}
