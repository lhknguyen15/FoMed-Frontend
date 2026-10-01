import {
  Activity, BarChart3, CalendarDays, CalendarOff, ClipboardList, Clock3, FileText, FlaskConical,
  HeartPulse, LayoutDashboard, PackageOpen, Pill, ReceiptText, ShieldCheck, Stethoscope,
  UserCog, UserRound, UsersRound, WalletCards,
} from 'lucide-react'
import type { NavItem, Role } from '../types'

export const roleHome: Record<Role, string> = {
  'Bệnh nhân': '/booking',
  'Lễ tân': '/reception',
  'Bác sĩ': '/doctor/queue',
  'Kỹ thuật viên': '/technician/orders',
  'Dược sĩ': '/pharmacy/inventory',
  'Quản trị': '/admin/dashboard',
}

export const roleNavigation: Record<Role, NavItem[]> = {
  'Bệnh nhân': [
    { label: 'Đặt lịch khám', path: '/booking', icon: CalendarDays },
    { label: 'Lịch hẹn của tôi', path: '/my-appointments', icon: Clock3, badge: '2' },
    { label: 'Hồ sơ sức khỏe', path: '/my-records', icon: FileText },
    { label: 'Hóa đơn', path: '/my-invoices', icon: ReceiptText },
  ],
  'Lễ tân': [
    { label: 'Bàn tiếp đón', path: '/reception', icon: LayoutDashboard },
    { label: 'Hồ sơ bệnh nhân', path: '/reception/patients', icon: UsersRound },
    { label: 'Đặt lịch tại quầy', path: '/reception/booking', icon: CalendarDays },
    { label: 'Hàng chờ', path: '/reception/queue', icon: Clock3, badge: '6' },
    { label: 'Thu ngân', path: '/reception/cashier/871', icon: WalletCards },
  ],
  'Bác sĩ': [
    { label: 'Hàng chờ của tôi', path: '/doctor/queue', icon: UsersRound, badge: '6' },
    { label: 'Khám bệnh', path: '/doctor/exam/451', icon: Stethoscope },
    { label: 'Chỉ định & kết quả', path: '/doctor/exam/451/services', icon: FlaskConical },
    { label: 'Kê đơn thuốc', path: '/doctor/exam/451/prescription', icon: Pill },
  ],
  'Kỹ thuật viên': [
    { label: 'Chờ thực hiện', path: '/technician/orders', icon: FlaskConical, badge: '4' },
    { label: 'Đã trả kết quả', path: '/technician/results', icon: ClipboardList },
  ],
  'Dược sĩ': [
    { label: 'Kho thuốc', path: '/pharmacy/inventory', icon: PackageOpen },
    { label: 'Phát thuốc', path: '/pharmacy/dispense/451', icon: Pill, badge: '3' },
    { label: 'Nhập thuốc', path: '/pharmacy/receipt', icon: ReceiptText },
  ],
  'Quản trị': [
    { label: 'Tổng quan', path: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Bác sĩ', path: '/admin/doctors', icon: Stethoscope },
    { label: 'Chuyên khoa', path: '/admin/specialties', icon: HeartPulse },
    { label: 'Lịch nghỉ', path: '/admin/time-off', icon: CalendarOff },
    { label: 'Danh mục dịch vụ', path: '/admin/services', icon: Activity },
    { label: 'Người dùng', path: '/admin/users', icon: UserRound },
    { label: 'Vai trò', path: '/admin/roles', icon: UserCog },
    { label: 'Báo cáo', path: '/admin/reports', icon: BarChart3 },
    { label: 'Nhật ký hệ thống', path: '/admin/audit-logs', icon: ShieldCheck },
  ],
}

export const screenMeta: Record<string, { eyebrow: string; title: string; description: string }> = {
  '/booking': { eyebrow: 'Đặt lịch trực tuyến', title: 'Hôm nay bạn cần thăm khám gì?', description: 'Chọn chuyên khoa, bác sĩ và thời gian phù hợp với bạn.' },
  '/my-appointments': { eyebrow: 'Cổng bệnh nhân', title: 'Lịch hẹn của tôi', description: 'Theo dõi và quản lý các lịch khám sắp tới.' },
  '/my-records': { eyebrow: 'Cổng bệnh nhân', title: 'Hồ sơ sức khỏe', description: 'Bệnh án, đơn thuốc và kết quả cận lâm sàng của bạn.' },
  '/my-invoices': { eyebrow: 'Cổng bệnh nhân', title: 'Hóa đơn của tôi', description: 'Theo dõi chi phí khám và lịch sử thanh toán.' },
  '/reception': { eyebrow: 'Bàn tiếp đón', title: 'Lịch hẹn hôm nay', description: 'Theo dõi bệnh nhân đến khám và xử lý check-in tại quầy.' },
  '/reception/patients': { eyebrow: 'Bàn tiếp đón', title: 'Hồ sơ bệnh nhân', description: 'Tra cứu, cập nhật và tạo nhanh hồ sơ bệnh nhân.' },
  '/reception/booking': { eyebrow: 'Bàn tiếp đón', title: 'Đặt lịch tại quầy', description: 'Đặt hộ qua điện thoại hoặc tiếp nhận khách vãng lai.' },
  '/reception/queue': { eyebrow: 'Điều phối khám', title: 'Hàng chờ phòng khám', description: 'Theo dõi thứ tự và thời gian chờ theo thời gian thực.' },
  '/doctor/queue': { eyebrow: 'Không gian bác sĩ', title: 'Bệnh nhân chờ khám', description: 'Danh sách đã check-in và sẵn sàng thăm khám.' },
  '/doctor/exam/451': { eyebrow: 'Phiếu khám A2026-0451', title: 'Khám bệnh', description: 'Trần Thị B · BN000125 · Nữ, 34 tuổi' },
  '/doctor/exam/451/services': { eyebrow: 'Phiếu khám A2026-0451', title: 'Chỉ định cận lâm sàng', description: 'Theo dõi chỉ định và kết quả thực hiện.' },
  '/doctor/exam/451/prescription': { eyebrow: 'Phiếu khám A2026-0451', title: 'Kê đơn thuốc', description: 'Kiểm tra tồn khả dụng và cảnh báo dị ứng trước khi kê.' },
  '/technician/orders': { eyebrow: 'Cận lâm sàng', title: 'Chỉ định chờ thực hiện', description: 'Tiếp nhận mẫu và trả kết quả cho bác sĩ.' },
  '/technician/results': { eyebrow: 'Cận lâm sàng', title: 'Kết quả đã trả', description: 'Tra cứu các kết quả hoàn thành trong ngày.' },
  '/pharmacy/inventory': { eyebrow: 'Nhà thuốc', title: 'Kho thuốc & lô hạn dùng', description: 'Theo dõi tồn kho, hạn dùng và cảnh báo nhập hàng.' },
  '/pharmacy/dispense/451': { eyebrow: 'Nhà thuốc', title: 'Phát thuốc theo đơn', description: 'Xuất kho theo nguyên tắc FEFO và ghi nhận từng lô.' },
  '/pharmacy/receipt': { eyebrow: 'Nhà thuốc', title: 'Tạo phiếu nhập thuốc', description: 'Nhập nhiều lô thuốc từ nhà cung cấp.' },
  '/admin/doctors': { eyebrow: 'Quản trị hệ thống', title: 'Bác sĩ & chuyên khoa', description: 'Quản lý hồ sơ hành nghề và chuyên khoa phụ trách.' },
  '/admin/schedules': { eyebrow: 'Quản trị hệ thống', title: 'Lịch làm việc & nghỉ phép', description: 'Cấu hình ca khám, thời lượng slot và thời gian nghỉ.' },
  '/admin/services': { eyebrow: 'Quản trị hệ thống', title: 'Danh mục dịch vụ', description: 'Quản lý dịch vụ khám, xét nghiệm và đơn giá.' },
  '/admin/users': { eyebrow: 'Quản trị hệ thống', title: 'Người dùng & phân quyền', description: 'Kiểm soát tài khoản, vai trò và trạng thái truy cập.' },
  '/admin/reports': { eyebrow: 'Tổng quan vận hành', title: 'Xin chào, Minh Anh', description: 'Đây là tình hình hoạt động của phòng khám hôm nay.' },
  '/admin/audit-logs': { eyebrow: 'An toàn dữ liệu', title: 'Nhật ký hệ thống', description: 'Theo dõi truy cập bệnh án và thao tác nghiệp vụ nhạy cảm.' },
}
