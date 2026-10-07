import { Link } from 'react-router-dom'
import { ArrowUpRight, Clock3, HeartPulse, LockKeyhole } from 'lucide-react'
import logo from '../../../assets/images/FoMed_Logo.png'
import PublicBookingCTA from './PublicBookingCTA'

const linkStyle = 'inline-flex items-center gap-1.5 py-1 text-sm text-slate-300 transition hover:text-teal-300'

export default function PublicFooter() {
  return <footer className="bg-slate-950 text-slate-300">
    <PublicBookingCTA />
    <div className="mx-auto grid max-w-7xl gap-9 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-[1.3fr_1fr_1fr_1.1fr] lg:gap-10 lg:px-8">
      <div><Link to="/" className="inline-flex items-center gap-3"><img src={logo} alt="" className="size-11 rounded-xl bg-white object-contain p-1" /><span className="font-display text-2xl font-extrabold text-white">Fo<span className="text-teal-400">Med</span></span></Link><p className="mt-4 max-w-sm text-sm leading-7 text-slate-400">Kết nối người bệnh với bác sĩ, hỗ trợ đặt lịch và theo dõi hành trình chăm sóc sức khỏe tại FoMed.</p><span className="mt-4 inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs text-teal-200"><HeartPulse className="size-4" /> Một lịch hẹn, một bước chăm sóc</span></div>
      <div><h2 className="text-sm font-bold text-white">Khám phá FoMed</h2><nav className="mt-4 flex flex-col items-start gap-2" aria-label="Khám phá ở chân trang"><Link className={linkStyle} to="/doctors">Danh sách bác sĩ</Link><Link className={linkStyle} to="/specialties">Các chuyên khoa</Link><Link className={linkStyle} to="/services">Dịch vụ & bảng giá</Link><a className={linkStyle} href="/#about">Về FoMed <ArrowUpRight className="size-3.5" /></a></nav></div>
      <div><h2 className="text-sm font-bold text-white">Hướng dẫn & hỗ trợ</h2><nav className="mt-4 flex flex-col items-start gap-2" aria-label="Hỗ trợ ở chân trang"><a className={linkStyle} href="/#how-it-works">Hướng dẫn đặt khám</a><a className={linkStyle} href="/#faq">Câu hỏi thường gặp</a><Link className={linkStyle} to="/register">Tạo tài khoản bệnh nhân</Link><Link className={linkStyle} to="/forgot-password">Quên mật khẩu</Link></nav><p className="mt-4 flex items-start gap-2 text-xs leading-5 text-slate-400"><LockKeyhole className="mt-0.5 size-4 shrink-0 text-teal-400" /> Không chia sẻ mật khẩu hoặc thông tin đăng nhập của bạn.</p></div>
      <div><h2 className="text-sm font-bold text-white">FoMed đang phát triển</h2><p className="mt-4 text-sm leading-6 text-slate-400">Mở rộng trải nghiệm chăm sóc sức khỏe trong các phiên bản tiếp theo.</p><ul className="mt-4 space-y-3 text-sm"><li className="flex flex-wrap items-center justify-between gap-2"><Link className={linkStyle} to="/online-consultation">Tư vấn trực tuyến</Link><ComingSoon /></li><li className="flex flex-wrap items-center justify-between gap-2"><Link className={linkStyle} to="/health-news">Tin tức y tế</Link><ComingSoon /></li><li className="flex flex-wrap items-center justify-between gap-2"><span>Ứng dụng di động</span><ComingSoon /></li><li className="flex flex-wrap items-center justify-between gap-2"><span>Kênh liên hệ hỗ trợ</span><ComingSoon /></li></ul></div>
    </div>
    <div className="border-t border-white/10"><div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-5 sm:px-6 lg:flex-row lg:items-start lg:justify-between lg:px-8"><p className="shrink-0 text-xs text-slate-500">© {new Date().getFullYear()} FoMed.</p><p className="max-w-3xl text-xs leading-5 text-slate-400">Thông tin trên website dành cho mục đích tham khảo, không thay thế việc thăm khám, chẩn đoán hoặc điều trị bởi nhân viên y tế. Hồ sơ minh họa được ghi chú riêng trong phần giới thiệu bác sĩ.</p></div></div>
  </footer>
}

function ComingSoon() {
  return <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2 py-1 text-[10px] text-slate-400"><Clock3 className="size-3" /> Sắp ra mắt</span>
}
