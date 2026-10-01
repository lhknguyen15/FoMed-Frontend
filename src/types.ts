import type { LucideIcon } from 'lucide-react'

export type Role = 'Bệnh nhân' | 'Lễ tân' | 'Bác sĩ' | 'Kỹ thuật viên' | 'Dược sĩ' | 'Quản trị'

export type NavItem = {
  label: string
  path: string
  icon: LucideIcon
  badge?: string
}

export type AppointmentStatus = 'Đã check-in' | 'Chờ xác nhận' | 'Đang khám' | 'Hoàn tất' | 'Không đến'

export type Appointment = {
  id: number
  time: string
  queue?: string
  patient: string
  code: string
  phone: string
  doctor: string
  specialty: string
  status: AppointmentStatus
  checkedIn?: string
}

export type TableColumn<T> = {
  key: keyof T | string
  label: string
  className?: string
  render?: (row: T) => React.ReactNode
}
