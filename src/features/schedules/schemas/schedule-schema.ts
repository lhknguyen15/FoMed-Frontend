import type { SaveAdminDoctorScheduleBatchInput } from '../api/schedule-api'

const minutes = (value: string) => {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) return NaN
  return Number(value.slice(0, 2)) * 60 + Number(value.slice(3, 5))
}
export function scheduleValidation(value: SaveAdminDoctorScheduleBatchInput): string | null {
  if (!Number.isSafeInteger(value.doctorId) || value.doctorId < 1) return 'Vui lòng chọn bác sĩ.'
  if (!value.dayOfWeeks.length || new Set(value.dayOfWeeks).size !== value.dayOfWeeks.length || value.dayOfWeeks.some(day => !Number.isInteger(day) || day < 0 || day > 6)) return 'Vui lòng chọn ngày làm việc hợp lệ, không chọn lặp ngày.'
  const start = minutes(value.startTime); const end = minutes(value.endTime)
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return 'Giờ kết thúc phải sau giờ bắt đầu trong cùng ngày.'
  if (!Number.isInteger(value.slotMinutes) || value.slotMinutes < 5 || value.slotMinutes > 240 || end - start < value.slotMinutes) return 'Mỗi lượt khám từ 5 đến 240 phút và phải nằm trọn trong ca làm việc.'
  return null
}
