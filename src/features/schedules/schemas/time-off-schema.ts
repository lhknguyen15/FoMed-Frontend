export type TimeOffFormValues = {
  doctorId: string
  startAt: string
  endAt: string
  reason: string
}

export function validateTimeOff(values: TimeOffFormValues) {
  const errors: Partial<Record<keyof TimeOffFormValues, string>> = {}
  if (!values.startAt) errors.startAt = 'Thời điểm bắt đầu là bắt buộc.'
  if (!values.endAt) errors.endAt = 'Thời điểm kết thúc là bắt buộc.'
  if (values.startAt && values.endAt && new Date(values.endAt) <= new Date(values.startAt)) errors.endAt = 'Thời điểm kết thúc phải sau thời điểm bắt đầu.'
  if (values.reason.trim().length > 255) errors.reason = 'Lý do tối đa 255 ký tự.'
  return errors
}
