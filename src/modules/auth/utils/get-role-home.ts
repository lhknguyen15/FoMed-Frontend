import type { SessionUser } from '../../../shared/api/token-storage'

const priority = ['Admin', 'Receptionist', 'Doctor', 'Technician', 'Pharmacist', 'Patient']
const homeByRole: Record<string, string> = {
  Admin: '/admin/reports',
  Receptionist: '/reception',
  Doctor: '/doctor/queue',
  Technician: '/technician/orders',
  Pharmacist: '/pharmacy/inventory',
  Patient: '/booking',
}

export function getRoleHome(user: SessionUser) {
  const role = priority.find((item) => user.roles.some((userRole) => userRole.toLowerCase() === item.toLowerCase()))
  return role ? homeByRole[role] : '/forbidden'
}
