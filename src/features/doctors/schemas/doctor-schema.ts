export type DoctorFormValues = {
  username: string
  password: string
  email: string
  fullName: string
  specialtyId: string
  title: string
  licenseNumber: string
  phone: string
  room: string
  consultationFee: string
  isActive: boolean
}

export function validateDoctor(values: DoctorFormValues, editing: boolean) {
  const errors: Partial<Record<keyof DoctorFormValues, string>> = {}
  if (!editing && !values.username.trim()) errors.username = 'Tên đăng nhập là bắt buộc.'
  if (!editing && values.password.length < 8) errors.password = 'Mật khẩu phải có ít nhất 8 ký tự.'
  if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) errors.email = 'Email không hợp lệ.'
  if (!values.fullName.trim()) errors.fullName = 'Họ tên bác sĩ là bắt buộc.'
  if (!Number(values.specialtyId)) errors.specialtyId = 'Vui lòng chọn chuyên khoa.'
  if (values.phone && !/^(0|\+84)\d{9,10}$/.test(values.phone.replace(/\s/g, ''))) errors.phone = 'Số điện thoại không hợp lệ.'
  if (Number(values.consultationFee) < 0 || Number.isNaN(Number(values.consultationFee))) errors.consultationFee = 'Phí khám không hợp lệ.'
  return errors
}

export function validateSpecialty(name: string) {
  if (!name.trim()) return 'Tên chuyên khoa là bắt buộc.'
  if (name.trim().length > 255) return 'Tên chuyên khoa tối đa 255 ký tự.'
  return ''
}
