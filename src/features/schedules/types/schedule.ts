export type DoctorTimeOff = {
  id: number
  doctorId?: number | null
  startAt: string
  endAt: string
  reason?: string | null
}

export type AdminDoctorSchedule = {
  version?: string
  id: number
  doctorId: number
  doctorName: string
  dayOfWeek: number
  startTime: string
  endTime: string
  slotMinutes: number
  isActive: boolean
}

export type ScheduleDoctorChoice = { doctorId: number; fullName: string; title?: string | null; isActive: boolean }
