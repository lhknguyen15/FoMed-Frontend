export type ServiceFormValues = {
  code: string
  name: string
  description: string
  price: string
  specialtyId: string
  durationMinutes: string
  isActive: boolean
}

export function validateService(values: ServiceFormValues) {
  const errors: Partial<Record<keyof ServiceFormValues, string>> = {}
  const price = Number(values.price)
  const duration = Number(values.durationMinutes)

  if (values.code.trim().length > 50) errors.code = 'Mã dịch vụ tối đa 50 ký tự.'
  if (!values.name.trim()) errors.name = 'Tên dịch vụ là bắt buộc.'
  else if (values.name.trim().length > 255) errors.name = 'Tên dịch vụ tối đa 255 ký tự.'
  if (values.description.trim().length > 500) errors.description = 'Mô tả tối đa 500 ký tự.'
  if (!values.price.trim() || Number.isNaN(price) || price < 0 || price > 9_999_999_999.99) errors.price = 'Đơn giá phải là số từ 0 đến 9.999.999.999,99.'
  if (!Number.isInteger(duration) || duration < 5 || duration > 1440) errors.durationMinutes = 'Thời lượng phải từ 5 đến 1440 phút.'

  return errors
}
