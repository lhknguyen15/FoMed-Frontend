import type { Appointment } from '../types/appointment'

export type PatientAppointmentGroup = 'upcoming' | 'in-progress' | 'needs-attention' | 'completed' | 'closed'

export const patientAppointmentGroups: { value: PatientAppointmentGroup; label: string; description: string }[] = [
  { value: 'upcoming', label: 'Sắp tới', description: 'Lịch chờ xác nhận hoặc đã xác nhận, chưa đến giờ hẹn.' },
  { value: 'in-progress', label: 'Đang khám', description: 'Các lượt đã được phòng khám ghi nhận đang khám, kể cả lượt từ ngày trước.' },
  { value: 'needs-attention', label: 'Cần xử lý', description: 'Lịch đã đến hoặc qua giờ hẹn nhưng chưa được ghi nhận đang khám hay hoàn tất, hoặc thông tin chưa rõ. Không tự hủy lịch; liên hệ lễ tân nếu cần hỗ trợ.' },
  { value: 'completed', label: 'Đã khám', description: 'Các lượt đã hoàn tất. Bạn có thể xem lại bệnh án.' },
  { value: 'closed', label: 'Đã hủy / Vắng mặt', description: 'Lịch đã được phòng khám ghi nhận hủy hoặc vắng mặt.' },
]

// Appointment/slot values without an offset are Vietnam wall-clock time in the API contract.
// Explicit Z/offset values retain their instant, regardless of the browser's time zone.
export function appointmentTimestamp(value: string): number {
  if (typeof value !== 'string') return NaN
  const parts = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?(Z|[+-]\d{2}:\d{2})?$/.exec(value)
  if (!parts) return NaN
  const [, year, month, day, hour, minute, second, offset] = parts
  const monthNumber = Number(month)
  const dayNumber = Number(day)
  if (monthNumber < 1 || monthNumber > 12 || dayNumber < 1 || dayNumber > new Date(Date.UTC(Number(year), monthNumber, 0)).getUTCDate()
    || Number(hour) > 23 || Number(minute) > 59 || Number(second ?? 0) > 59) return NaN
  return Date.parse(offset ? value : `${value}+07:00`)
}

export function patientAppointmentGroup(appointment: Pick<Appointment, 'status' | 'startTime'>, now: number): PatientAppointmentGroup {
  if (appointment.status === 2) return 'in-progress'
  if (appointment.status === 3) return 'completed'
  if (appointment.status === 4 || appointment.status === 5) return 'closed'
  if ((appointment.status === 0 || appointment.status === 1) && appointmentTimestamp(appointment.startTime) > now) return 'upcoming'
  // Keep unresolved/invalid records visible, without guessing a cancelled/no-show status.
  return 'needs-attention'
}

export function filterPatientAppointments(appointments: Appointment[], group: PatientAppointmentGroup, now: number): Appointment[] {
  return appointments.filter(appointment => patientAppointmentGroup(appointment, now) === group).sort((a, b) => {
    const aTime = appointmentTimestamp(a.startTime)
    const bTime = appointmentTimestamp(b.startTime)
    if (!Number.isFinite(aTime)) return Number.isFinite(bTime) ? 1 : b.id - a.id
    if (!Number.isFinite(bTime)) return -1
    const timeOrder = group === 'upcoming' || group === 'in-progress' ? aTime - bTime : bTime - aTime
    return timeOrder || b.id - a.id
  })
}

export function canChangePatientAppointment(appointment: Pick<Appointment, 'status' | 'startTime'>, now: number): boolean {
  // Mirror AppointmentService.PatientChangeCutoff; the server remains authoritative.
  return (appointment.status === 0 || appointment.status === 1) && appointmentTimestamp(appointment.startTime) > now + 24 * 60 * 60 * 1000
}

export function formatAppointmentTime(value: string, options: Intl.DateTimeFormatOptions = { dateStyle: 'short', timeStyle: 'short' }): string {
  const timestamp = appointmentTimestamp(value)
  return Number.isFinite(timestamp) ? new Intl.DateTimeFormat('vi-VN', { ...options, timeZone: 'Asia/Ho_Chi_Minh' }).format(timestamp) : 'Chưa xác định thời gian'
}

export function clinicDateInput(timestamp: number): string {
  return Number.isFinite(timestamp) ? new Date(timestamp + 7 * 60 * 60 * 1000).toISOString().slice(0, 10) : ''
}
