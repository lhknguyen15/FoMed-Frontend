import { ArrowRight, CalendarDays } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function PublicBookingCTA() {
  return <div className="border-b border-white/10 bg-teal-800">
    <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-8 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
      <div className="flex items-start gap-4"><span className="hidden size-12 shrink-0 place-items-center rounded-2xl bg-white/10 text-teal-100 sm:grid"><CalendarDays className="size-6" /></span><div><h2 className="font-display text-xl font-bold text-white">Chủ động dành thời gian cho sức khỏe</h2><p className="mt-1.5 text-sm leading-6 text-teal-100">Tìm bác sĩ phù hợp và chọn lịch khám ngay trên FoMed.</p></div></div>
      <Link to="/login?returnUrl=%2Fbooking" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-teal-900 transition hover:bg-teal-50">Đặt lịch khám <ArrowRight className="size-4" /></Link>
    </div>
  </div>
}
