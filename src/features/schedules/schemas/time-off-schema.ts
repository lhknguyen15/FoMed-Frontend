export type TimeOffFormValues = {
  doctorId: string
  startAt: string
  endAt: string
  reason: string
}

const validDateTime = (value: string) => {
  const parts = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value)
  if (!parts || Number(parts[1]) < 1) return false
  const date = new Date(value)
  return Number.isFinite(date.getTime()) && [date.getFullYear(), date.getMonth() + 1, date.getDate(), date.getHours(), date.getMinutes()].every((part, index) => part === Number(parts[index + 1]))
}

export function validateTimeOff(values: TimeOffFormValues) {
  const errors: Partial<Record<keyof TimeOffFormValues, string>> = {}
  if (!values.startAt) errors.startAt = 'Thời điểm bắt đầu là bắt buộc.'
  if (!values.endAt) errors.endAt = 'Thời điểm kết thúc là bắt buộc.'
  if (values.startAt && !validDateTime(values.startAt)) errors.startAt = 'Thời điểm bắt đầu không hợp lệ.'
  if (values.endAt && !validDateTime(values.endAt)) errors.endAt = 'Thời điểm kết thúc không hợp lệ.'
  if (values.doctorId && (!/^\d+$/.test(values.doctorId) || !Number.isSafeInteger(Number(values.doctorId)) || Number(values.doctorId) < 1)) errors.doctorId = 'Vui lòng chọn bác sĩ hợp lệ.'
  if (values.startAt && values.endAt && new Date(values.endAt) <= new Date(values.startAt)) errors.endAt = 'Thời điểm kết thúc phải sau thời điểm bắt đầu.'
  if (values.reason.trim().length > 255) errors.reason = 'Lý do tối đa 255 ký tự.'
  return errors
}
