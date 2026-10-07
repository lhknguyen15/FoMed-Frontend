import { displayError } from '../../../shared/api/user-messages'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, CalendarDays, CheckCircle2, Stethoscope } from 'lucide-react'
import { catalogApi } from '../../../features/catalogs/api/catalog-api'
import type { PublicDoctorDetail } from '../../../features/catalogs/types/catalog'
import { ApiError } from '../../../shared/api/api-error'
import DoctorAvatar from '../../../features/doctors/components/DoctorAvatar'
import PublicHeader from '../components/PublicHeader'
import PublicFooter from '../components/PublicFooter'

export default function DoctorDetailPage() {
  const { doctorId } = useParams()
  const id = Number(doctorId)
  const [doctor, setDoctor] = useState<PublicDoctorDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    setLoading(true)
    setDoctor(null)
    setError('')
    if (!Number.isInteger(id) || id < 1) {
      setDoctor(null)
      setLoading(false)
      return () => { active = false }
    }
    void catalogApi.doctor(id).then((data) => {
      if (active) setDoctor(data)
    }).catch((reason: unknown) => {
      if (active && !(reason instanceof ApiError && reason.status === 404)) setError(displayError(reason, 'Không thể tải thông tin bác sĩ.'))
    }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [id])

  const fee = doctor ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(doctor.consultationFee) : ''
  const bookingPath = doctor ? `/login?returnUrl=${encodeURIComponent(`/booking?doctorId=${doctor.doctorId}`)}` : '/login?returnUrl=%2Fbooking'
  const fullName = doctor ? `${doctor.title ? `${doctor.title} ` : ''}${doctor.fullName}` : ''

  return <div className="min-h-screen bg-[#f7f8fa]"><PublicHeader /><main className="mx-auto max-w-7xl px-4 py-6 sm:px-7 sm:py-9">
    <Link to="/doctors" className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-teal-700"><ArrowLeft className="size-3.5" /> Danh sách bác sĩ</Link>
    {loading ? <div className="mt-5 grid min-h-64 place-items-center rounded-xl border border-slate-200 bg-white text-sm text-slate-500">Đang tải hồ sơ bác sĩ...</div> : error ? <div role="alert" className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div> : !doctor ? <div className="mt-5 rounded-xl border border-slate-200 bg-white p-8 text-center"><h1 className="font-display text-xl font-bold text-slate-900">Không tìm thấy bác sĩ</h1><p className="mt-2 text-sm text-slate-500">Bác sĩ có thể chưa được công khai hoặc đã bị gỡ khỏi danh mục.</p><Link to="/doctors" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-teal-700">Quay lại danh sách <ArrowRight className="size-4" /></Link></div> : <>
      <nav aria-label="Đường dẫn" className="mb-4 mt-3 flex items-center gap-2 text-xs text-slate-500"><Link to="/" className="hover:text-teal-700">Trang chủ</Link><span>/</span><Link to="/doctors" className="hover:text-teal-700">Bác sĩ</Link><span>/</span><span className="truncate text-slate-700">{doctor.fullName}</span></nav>

      <div className="mx-auto grid max-w-5xl items-stretch gap-4 md:grid-cols-[minmax(0,1fr)_320px]">
        <section className="flex flex-col justify-center rounded-xl border border-slate-200 bg-white p-5 sm:p-7">
          <div className="flex items-start gap-4 sm:gap-5">
            <DoctorAvatar name={doctor.fullName} url={doctor.avatarUrl} className="size-16 text-xl sm:size-20 sm:text-2xl" />
            <div className="min-w-0 pt-1">
              <p className="text-xs font-bold uppercase tracking-[.12em] text-teal-700">Hồ sơ bác sĩ</p>
              <h1 className="mt-1 font-display text-xl font-extrabold leading-snug text-slate-950 sm:text-2xl">{fullName}</h1>
              <Link to={`/doctors?specialtyId=${doctor.specialtyId}`} className="mt-3 inline-flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1.5 text-sm font-semibold text-teal-800 transition hover:bg-teal-100"><Stethoscope className="size-4" />{doctor.specialtyName}</Link>
              {(doctor.room || doctor.practiceStartYear != null) && <dl className="mt-4 space-y-2 text-sm">
                {doctor.practiceStartYear != null && <div><dt className="inline text-slate-500">Bắt đầu hành nghề: </dt><dd className="inline font-semibold text-slate-800">{doctor.practiceStartYear}</dd></div>}
                {doctor.room && <div><dt className="inline text-slate-500">Phòng khám: </dt><dd className="inline font-semibold text-slate-800">{doctor.room}</dd></div>}
              </dl>}
            </div>
          </div>
        </section>

        <aside className="flex flex-col justify-center rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
          <p className="text-xs font-bold uppercase tracking-[.12em] text-slate-500">Phí khám</p>
          <p className="mt-1 font-display text-2xl font-extrabold text-slate-950">{fee}</p>
          <Link to={bookingPath} className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-teal-700 px-4 text-sm font-bold text-white transition hover:bg-teal-800"><CalendarDays className="size-4" /> Đặt khám ngay</Link>
          <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-slate-500"><CheckCircle2 className="size-3.5 text-teal-700" /> Đăng nhập để chọn lịch trống</p>
        </aside>
      </div>
      {(doctor.biography || doctor.specialtyDescription) && <div className="mx-auto mt-4 max-w-5xl space-y-4">
        {doctor.biography && <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-7"><h2 className="font-display text-lg font-bold text-slate-900">Giới thiệu bác sĩ</h2><p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-slate-600">{doctor.biography}</p></section>}
        {doctor.specialtyDescription && <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-7"><h2 className="font-display text-lg font-bold text-slate-900">Chuyên khoa {doctor.specialtyName}</h2><p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-slate-600">{doctor.specialtyDescription}</p></section>}
      </div>}
    </>}
  </main><PublicFooter /></div>
}
