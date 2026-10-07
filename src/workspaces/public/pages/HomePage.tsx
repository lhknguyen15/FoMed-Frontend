import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { ArrowRight, CalendarCheck2, Check, ChevronDown, ClipboardList, FileText, HeartPulse, Search, Stethoscope, Wallet } from 'lucide-react'
import { catalogApi } from '../../../features/catalogs/api/catalog-api'
import type { CatalogService, CatalogSpecialty, PublicDoctor } from '../../../features/catalogs/types/catalog'
import { useAuth } from '../../../features/auth/hooks/useAuth'
import { getRoleHome } from '../../../routes/role-home'
import DoctorAvatar from '../../../features/doctors/components/DoctorAvatar'
import PublicHeader from '../components/PublicHeader'
import PublicFooter from '../components/PublicFooter'
import { DoctorPreviewCard, ServicePreviewCard, SpecialtyPreviewCard } from '../components/PublicCatalogCards'
import PublicCatalogCarousel from '../components/PublicCatalogCarousel'

const appointmentUrl = '/login?returnUrl=%2Fbooking'
const container = 'mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'
const faqs = [
  { question: 'Tôi có cần tài khoản để đặt lịch khám không?', answer: 'Có. Bạn có thể xem danh sách bác sĩ, chuyên khoa và dịch vụ mà không cần đăng nhập. Để đặt lịch và quản lý lịch hẹn, hãy đăng nhập hoặc đăng ký tài khoản bệnh nhân.' },
  { question: 'Làm thế nào để chọn ngày và giờ khám?', answer: 'Mở hồ sơ bác sĩ, chọn Đặt khám ngay và đăng nhập. Trong màn hình đặt lịch, chọn ngày để xem các khung giờ còn trống theo lịch làm việc của bác sĩ.' },
  { question: 'Sau khi đặt lịch, tôi xem lịch hẹn ở đâu?', answer: 'Đăng nhập tài khoản bệnh nhân và mở mục Lịch hẹn của tôi. Tại đây bạn có thể xem thông tin buổi khám và trạng thái cập nhật của lịch hẹn.' },
  { question: 'Tôi có thể theo dõi bệnh án và hóa đơn không?', answer: 'Trong không gian bệnh nhân, các mục Bệnh án và Hóa đơn giúp bạn xem những dữ liệu được hệ thống ghi nhận cho hồ sơ của mình.' },
]

export default function HomePage() {
  const { user, isReady } = useAuth()
  const navigate = useNavigate()
  const [doctors, setDoctors] = useState<PublicDoctor[]>([])
  const [specialties, setSpecialties] = useState<CatalogSpecialty[]>([])
  const [services, setServices] = useState<CatalogService[]>([])
  const [failedSections, setFailedSections] = useState<number[]>([])
  const [search, setSearch] = useState('')
  const [retry, setRetry] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    setLoading(true)
    void Promise.allSettled([catalogApi.doctors(), catalogApi.specialties(), catalogApi.services()])
      .then((results) => {
        if (!active) return
        setDoctors(results[0].status === 'fulfilled' ? results[0].value : [])
        setSpecialties(results[1].status === 'fulfilled' ? results[1].value : [])
        setServices(results[2].status === 'fulfilled' ? results[2].value : [])
        setFailedSections(results.flatMap((result, index) => result.status === 'rejected' ? [index] : []))
        setLoading(false)
      })
    return () => { active = false }
  }, [retry])

  if (!isReady) return <div className="grid min-h-screen place-items-center bg-teal-50" role="status" aria-label="Đang tải"><span className="size-8 animate-spin rounded-full border-[3px] border-teal-100 border-t-teal-700" /></div>
  if (user) return <Navigate to={getRoleHome(user)} replace />

  const sectionState = (index: number, count: number, label: string) =>
    loading ? <CatalogSkeleton /> : failedSections.includes(index) ? <CatalogError onRetry={() => setRetry((value) => value + 1)} /> : count === 0 ? <EmptyCatalog label={label} /> : null

  return <div className="min-h-screen bg-white text-slate-900">
    <PublicHeader />
    <main id="top">
      <section className="relative overflow-hidden border-b border-teal-100 bg-gradient-to-br from-[#e3f5f0] via-teal-50 to-sky-50">
        <div aria-hidden="true" className="absolute -left-28 -top-32 size-80 rounded-full border-[45px] border-white/30" />
        <div className={container + ' relative grid items-center gap-9 py-12 sm:py-16 lg:grid-cols-[1.05fr_.95fr] lg:gap-12'}>
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-white/80 px-3 py-2 text-xs font-semibold text-teal-800"><HeartPulse className="size-4" /> Chăm sóc sức khỏe chủ động</span>
            <h1 className="mt-5 font-display text-3xl font-extrabold leading-tight tracking-tight text-slate-950 sm:text-4xl lg:text-[2.75rem]">Tìm bác sĩ phù hợp.<br /><span className="text-teal-700">Đặt khám thật dễ dàng.</span></h1>
            <p className="mt-4 max-w-lg text-sm leading-7 text-slate-600 sm:text-base">Khám phá chuyên khoa, tham khảo dịch vụ và chọn lịch khám phù hợp với bạn — ngay tại FoMed.</p>
            <form onSubmit={(event) => { event.preventDefault(); navigate(search.trim() ? '/doctors?search=' + encodeURIComponent(search.trim()) : '/doctors') }} className="mt-7 flex flex-col gap-2 rounded-2xl border border-teal-100 bg-white p-2 shadow-lg shadow-teal-900/5 sm:flex-row">
              <label className="flex min-w-0 flex-1 items-center gap-3 px-3 py-3"><Search className="size-5 shrink-0 text-teal-700" /><span className="sr-only">Tìm bác sĩ hoặc chuyên khoa</span><input type="search" name="doctorSearch" autoComplete="off" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tên bác sĩ hoặc chuyên khoa..." className="w-full min-w-0 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400" /></label>
              <button type="submit" className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-teal-700 px-5 text-sm font-bold text-white hover:bg-teal-800"><Search className="size-4" /> Tìm bác sĩ</button>
            </form>
            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-600"><span className="inline-flex items-center gap-1.5"><Check className="size-4 text-teal-700" /> Xem thông tin trước khi đặt khám</span><span className="inline-flex items-center gap-1.5"><Check className="size-4 text-teal-700" /> Chủ động chọn khung giờ</span></div>
            {specialties.length > 0 && <div className="mt-5 flex flex-wrap items-center gap-2"><span className="mr-1 text-xs text-slate-500">Khám phá:</span>{specialties.slice(0, 3).map((item) => <Link key={item.specialtyId} to={'/doctors?specialtyId=' + item.specialtyId} className="rounded-full border border-teal-200 bg-white/70 px-3 py-1.5 text-xs font-medium text-teal-800 hover:bg-white">{item.name}</Link>)}</div>}
          </div>
          <div className="relative mx-auto w-full max-w-lg">
            <div className="overflow-hidden rounded-3xl border border-white bg-teal-900 p-6 shadow-xl shadow-teal-900/15 sm:p-8">
              <div className="flex items-center justify-between"><span className="text-xs font-bold uppercase tracking-[.18em] text-teal-200">FoMed • Đồng hành cùng bạn</span><Stethoscope className="size-6 shrink-0 text-teal-300" /></div>
              <h2 className="mt-5 max-w-xs font-display text-2xl font-bold leading-snug text-white">Một nơi để bắt đầu<br />hành trình chăm sóc.</h2>
              <div className="mt-6 flex items-center gap-3 rounded-2xl bg-white/10 p-4"><span className="grid size-12 shrink-0 place-items-center rounded-xl bg-teal-300 text-teal-950"><CalendarCheck2 className="size-6" /></span><div><p className="text-sm font-bold text-white">Tìm bác sĩ · Chọn lịch · Đặt khám</p><p className="mt-1 text-xs leading-5 text-teal-100">Theo dõi lịch hẹn trong tài khoản của bạn.</p></div></div>
              <div className="mt-6 rounded-2xl bg-white p-5"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-bold text-slate-900">Khám phá đội ngũ bác sĩ</p><Link to="/doctors" className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700">Xem thêm <ArrowRight className="size-3.5" /></Link></div><div className="mt-4 flex items-center gap-3"><div className="flex -space-x-2">{doctors.slice(0, 3).map((doctor) => <DoctorAvatar key={doctor.doctorId} name={doctor.fullName} url={doctor.avatarUrl} className="size-11 border-2 border-white text-xs" />)}{!doctors.length && <span className="grid size-11 place-items-center rounded-full bg-teal-50 text-teal-700"><Stethoscope className="size-5" /></span>}</div><p className="text-xs leading-5 text-slate-500">Xem chuyên khoa và phí khám<br />trước khi chọn bác sĩ.</p></div></div>
            </div>
          </div>
        </div>
      </section>

      <section id="specialties" className="scroll-mt-24 border-b border-teal-100 bg-[#edf8f4] py-12 sm:py-14">
        <div className={container}>
          <SectionHeading eyebrow="CHỌN CHUYÊN KHOA" title="Chăm sóc đúng nhu cầu của bạn" description="Khám phá bác sĩ theo lĩnh vực bạn đang quan tâm." to="/specialties" linkLabel="Tất cả chuyên khoa" />
          {sectionState(1, specialties.length, 'chuyên khoa') ?? <PublicCatalogCarousel label="chuyên khoa" variant="specialties">{specialties.map((specialty, index) => <SpecialtyPreviewCard key={specialty.specialtyId} specialty={specialty} index={index} />)}</PublicCatalogCarousel>}
        </div>
      </section>

      <section id="doctors" className="scroll-mt-24 py-12 sm:py-14">
        <div className={container}>
          <SectionHeading eyebrow="ĐỘI NGŨ BÁC SĨ" title="Tìm người đồng hành cùng sức khỏe" description="Xem hồ sơ, chuyên khoa và phí khám để lựa chọn phù hợp." to="/doctors" linkLabel="Tất cả bác sĩ" />
          {sectionState(0, doctors.length, 'bác sĩ') ?? <PublicCatalogCarousel label="bác sĩ" variant="doctors">{doctors.map((doctor) => <DoctorPreviewCard key={doctor.doctorId} doctor={doctor} />)}</PublicCatalogCarousel>}
        </div>
      </section>

      <section id="services" className="scroll-mt-24 border-y border-teal-100 bg-[#edf8f4] py-12 sm:py-14">
        <div className={container}>
          <SectionHeading eyebrow="DỊCH VỤ & BẢNG GIÁ" title="Thông tin rõ ràng trước buổi khám" description="Tham khảo các dịch vụ đang có trong danh mục FoMed." to="/services" linkLabel="Xem tất cả dịch vụ" />
          {sectionState(2, services.length, 'dịch vụ') ?? <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{services.slice(0, 6).map((service) => <ServicePreviewCard key={service.id} service={service} />)}</div>}
          <p className="mt-5 text-xs leading-5 text-slate-500">Danh mục hiển thị thông tin tham khảo. Chỉ định dịch vụ cụ thể được thực hiện trong quá trình thăm khám.</p>
        </div>
      </section>

      <section id="about" className="scroll-mt-24 py-12 sm:py-14">
        <div className={container + ' grid gap-8 lg:grid-cols-[.85fr_1.15fr] lg:items-center'}>
          <div><span className="text-xs font-bold uppercase tracking-[.15em] text-teal-700">VỀ FOMED</span><h2 className="mt-2 font-display text-2xl font-bold leading-snug text-slate-950">Không chỉ là một lịch hẹn</h2><p className="mt-4 text-sm leading-7 text-slate-600">FoMed kết nối việc đặt khám với quá trình theo dõi thông tin sau buổi khám. Tài khoản bệnh nhân giúp bạn quản lý những dữ liệu được ghi nhận trong hệ thống ở một nơi.</p><Link to="/register" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-teal-700 hover:text-teal-900">Tạo tài khoản bệnh nhân <ArrowRight className="size-4" /></Link></div>
          <div className="grid gap-3 sm:grid-cols-2">{[
            { icon: CalendarCheck2, title: 'Quản lý lịch hẹn', text: 'Theo dõi thời gian khám và trạng thái lịch hẹn.', color: 'bg-teal-100 text-teal-800' },
            { icon: ClipboardList, title: 'Theo dõi bệnh án', text: 'Xem các hồ sơ khám được ghi nhận cho bạn.', color: 'bg-sky-100 text-sky-800' },
            { icon: FileText, title: 'Đơn thuốc & kết quả', text: 'Tra cứu thông tin trong hồ sơ khám của mình.', color: 'bg-violet-100 text-violet-800' },
            { icon: Wallet, title: 'Thông tin hóa đơn', text: 'Theo dõi hóa đơn và trạng thái thanh toán.', color: 'bg-amber-100 text-amber-800' },
          ].map(({ icon: Icon, title, text, color }) => <article key={title} className="rounded-2xl border border-slate-100 bg-slate-50 p-5"><span className={'grid size-10 place-items-center rounded-xl ' + color}><Icon className="size-5" /></span><h3 className="mt-3 text-sm font-bold text-slate-900">{title}</h3><p className="mt-2 text-xs leading-6 text-slate-500">{text}</p></article>)}</div>
        </div>
      </section>

      <section id="how-it-works" className="scroll-mt-24 bg-teal-900 py-12 text-white sm:py-14">
        <div className={container}><div className="max-w-2xl"><p className="text-xs font-bold uppercase tracking-[.15em] text-teal-300">BẮT ĐẦU THẬT ĐƠN GIẢN</p><h2 className="mt-2 font-display text-2xl font-bold">3 bước để đặt lịch khám</h2><p className="mt-3 text-sm leading-6 text-teal-100">Chuẩn bị cho buổi khám, từ việc lựa chọn bác sĩ đến gửi yêu cầu đặt lịch.</p></div>
          <div className="mt-7 grid gap-4 md:grid-cols-3">{[
            { number: '01', title: 'Tìm bác sĩ phù hợp', text: 'Tìm theo tên hoặc khám phá danh sách bác sĩ của từng chuyên khoa.', to: '/doctors', action: 'Khám phá bác sĩ', icon: Search },
            { number: '02', title: 'Đăng nhập tài khoản', text: 'Đăng nhập hoặc tạo tài khoản bệnh nhân để tiếp tục đặt lịch.', to: '/login', action: 'Đăng nhập', icon: ClipboardList },
            { number: '03', title: 'Chọn ngày & giờ khám', text: 'Chọn khung giờ còn trống và theo dõi trạng thái sau khi gửi yêu cầu.', to: appointmentUrl, action: 'Bắt đầu đặt lịch', icon: CalendarCheck2 },
          ].map(({ number, title, text, to, action, icon: Icon }) => <article key={number} className="flex flex-col rounded-2xl border border-white/15 bg-white/5 p-5 sm:p-6"><div className="flex items-center justify-between"><span className="font-display text-2xl font-bold text-teal-300">{number}</span><Icon className="size-6 text-teal-200" /></div><h3 className="mt-5 text-base font-bold">{title}</h3><p className="mt-2 text-sm leading-6 text-teal-100">{text}</p><Link to={to} className="mt-auto inline-flex items-center gap-2 pt-5 text-xs font-bold text-teal-200 hover:text-white">{action} <ArrowRight className="size-3.5" /></Link></article>)}</div>
        </div>
      </section>

      <section id="faq" className="scroll-mt-24 bg-slate-50 py-12 sm:py-14">
        <div className={container + ' grid gap-7 lg:grid-cols-[.7fr_1.3fr]'}><div><p className="text-xs font-bold uppercase tracking-[.15em] text-teal-700">GIẢI ĐÁP NHANH</p><h2 className="mt-2 font-display text-2xl font-bold text-slate-950">Bạn cần thêm thông tin?</h2><p className="mt-3 text-sm leading-6 text-slate-500">Một vài hướng dẫn trước khi bắt đầu sử dụng FoMed.</p><a href="#how-it-works" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-teal-700">Xem hướng dẫn đặt khám <ArrowRight className="size-4" /></a></div><div className="space-y-3">{faqs.map(({ question, answer }, index) => <details key={question} open={index === 0 ? true : undefined} className="group rounded-2xl border border-slate-200 bg-white"><summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 text-sm font-semibold leading-6 text-slate-800 [&::-webkit-details-marker]:hidden">{question}<ChevronDown className="size-4 shrink-0 text-teal-700 transition group-open:rotate-180" /></summary><p className="px-5 pb-5 text-sm leading-7 text-slate-500">{answer}</p></details>)}</div></div>
      </section>
    </main>
    <PublicFooter />
  </div>
}

function SectionHeading({ eyebrow, title, description, to, linkLabel }: { eyebrow: string; title: string; description: string; to: string; linkLabel: string }) {
  return <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div className="max-w-2xl"><p className="text-xs font-bold uppercase tracking-[.15em] text-teal-700">{eyebrow}</p><h2 className="mt-2 font-display text-2xl font-bold leading-snug tracking-tight text-slate-950">{title}</h2><p className="mt-3 text-sm leading-6 text-slate-500">{description}</p></div><Link to={to} className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-xl border border-teal-200 bg-white px-4 py-2.5 text-xs font-bold text-teal-800 transition hover:border-teal-400 hover:bg-teal-50 sm:self-auto">{linkLabel}<ArrowRight className="size-4" /></Link></div>
}

function CatalogSkeleton() {
  return <div role="status" aria-label="Đang tải danh mục" className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[0, 1, 2, 3].map((item) => <div key={item} aria-hidden="true" className="h-40 animate-pulse rounded-2xl border border-slate-200 bg-white motion-reduce:animate-none"><div className="m-5 h-12 w-12 rounded-xl bg-slate-100" /><div className="mx-5 h-3 rounded bg-slate-100" /><div className="mx-5 mt-3 h-3 w-1/2 rounded bg-slate-100" /></div>)}</div>
}

function EmptyCatalog({ label }: { label: string }) {
  return <div className="mt-7 rounded-2xl border border-dashed border-slate-300 bg-white/70 p-8 text-center text-sm text-slate-500">Hiện chưa có {label} để hiển thị.</div>
}

function CatalogError({ onRetry }: { onRetry: () => void }) {
  return <div role="alert" className="mt-7 flex flex-col items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center"><p className="text-sm text-amber-900">Chưa tải được dữ liệu danh mục. Bạn có thể thử lại.</p><button type="button" onClick={onRetry} className="rounded-xl border border-amber-300 bg-white px-4 py-2 text-sm font-semibold text-amber-900 hover:bg-amber-100">Tải lại</button></div>
}
