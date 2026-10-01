export type DoctorTimeOff = {
  id: number
  doctorId?: number | null
  startAt: string
  endAt: string
  reason?: string | null
}
