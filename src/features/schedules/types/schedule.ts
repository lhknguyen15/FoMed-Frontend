export type DoctorTimeOff = {
  id: number
  doctorId?: number | null
  startAt: string
  endAt: string
  reason?: string | null
}

export type AdminDoctorSchedule = {
  id: number
  doctorId: number
  doctorName: string
  dayOfWeek: number
  startTime: string
  endTime: string
  slotMinutes: number
  isActive: boolean
}
