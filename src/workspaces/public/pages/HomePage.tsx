import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { ArrowRight, CalendarCheck2, Check, ChevronDown, ClipboardList, FileText, Search, Stethoscope, Wallet } from 'lucide-react'
import { catalogApi } from '../../../features/catalogs/api/catalog-api'
import type { CatalogService, CatalogSpecialty, PublicDoctor } from '../../../features/catalogs/types/catalog'
import { useAuth } from '../../../features/auth/hooks/useAuth'
import { getRoleHome } from '../../../routes/role-home'
import healthcarePhoto from '../../../assets/images/home/healthcare-stethoscope.jpg'
import waitingRoomPhoto from '../../../assets/images/home/clinic-waiting-room.jpg'
import PublicHeader from '../components/PublicHeader'
import PublicFooter from '../components/PublicFooter'
import { DoctorPreviewCard, ServicePreviewCard, SpecialtyPreviewCard } from '../components/PublicCatalogCards'
import PublicCatalogCarousel from '../components/PublicCatalogCarousel'
import { specialtyPhotos } from '../components/specialty-photos'
import './home-page.css'

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

  return <div className="public-site fomed-home min-h-screen text-slate-900">
    <PublicHeader />
    <a className="home-skip-link" href="#home-content">Đến nội dung chính</a>
    <main id="top">
      <section id="home-content" tabIndex={-1} className="home-hero" aria-labelledby="home-title">
        <div className={container + ' home-hero-grid'}>
          <div>
            <p className="home-eyebrow"><span className="home-eyebrow-line" /> SỨC KHỎE CỦA BẠN, SỰ QUAN TÂM CỦA FOMED</p>
            <h1 id="home-title" className="home-title">Một lịch hẹn.<br /><span>Khởi đầu an tâm.</span></h1>
            <p className="home-intro">Tìm bác sĩ phù hợp, chủ động chọn giờ khám.<br className="hidden sm:block" /> FoMed cùng bạn chăm sóc sức khỏe, từ hôm nay.</p>
            <form role="search" onSubmit={(event) => { event.preventDefault(); navigate(search.trim() ? '/doctors?search=' + encodeURIComponent(search.trim()) : '/doctors') }} className="home-search">
              <label className="home-search-field"><Search aria-hidden="true" className="size-5 shrink-0 text-teal-700" /><span className="sr-only">Tìm bác sĩ hoặc chuyên khoa</span><input type="search" name="doctorSearch" autoComplete="off" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tên bác sĩ hoặc chuyên khoa" /></label>
              <button type="submit" className="home-primary-button">Tìm bác sĩ <ArrowRight aria-hidden="true" className="size-4" /></button>
            </form>
            {specialties.length > 0 && <div className="home-popular"><span>Khám phá:</span>{specialties.slice(0, 3).map((item) => <Link key={item.specialtyId} to={'/doctors?specialtyId=' + item.specialtyId}>{item.name}<ArrowRight aria-hidden="true" className="size-3" /></Link>)}</div>}
            <div className="home-reassurance"><span><Check aria-hidden="true" /> Thông tin và phí khám rõ ràng</span><span><Check aria-hidden="true" /> Theo dõi lịch hẹn dễ dàng</span></div>
          </div>
          <div className="home-hero-visual">
            <figure className="home-photo-frame">
              <div className="home-hero-photo"><HomePhoto src={healthcarePhoto} alt="Ảnh minh họa: tay cầm ống nghe trên áo blouse trắng" width={1200} height={1800} priority /></div>
              <figcaption className="home-photo-credit">Ảnh minh họa · <a href="https://www.pexels.com/photo/a-person-holding-a-stethoscope-5327579/" target="_blank" rel="noopener noreferrer">Thirdman / Pexels<span className="sr-only"> (mở trong thẻ mới)</span></a></figcaption>
            </figure>
            <Link className="home-photo-appointment" to="/doctors"><span className="home-photo-calendar"><CalendarCheck2 aria-hidden="true" className="size-6" /></span><span><strong>Lịch khám, theo thời gian của bạn</strong><span>Xem bác sĩ, tham khảo phí khám và chọn lịch phù hợp.</span></span><ArrowRight aria-hidden="true" className="size-5 shrink-0" /></Link>
          </div>
        </div>
      </section>

      <section id="specialties" className="home-section scroll-mt-24">
        <div className={container}>
          <SectionHeading eyebrow="CHỌN CHUYÊN KHOA" title="Chăm sóc đúng nhu cầu của bạn" description="Khám phá bác sĩ theo lĩnh vực bạn đang quan tâm." to="/specialties" linkLabel="Tất cả chuyên khoa" />
          {sectionState(1, specialties.length, 'chuyên khoa') ?? <PublicCatalogCarousel label="chuyên khoa" variant="specialties">{specialties.map((specialty) => <SpecialtyPreviewCard key={specialty.specialtyId} specialty={specialty} />)}</PublicCatalogCarousel>}
          {!loading && !failedSections.includes(1) && specialties.length > 0 && <details className="home-specialty-credits"><summary>Ảnh minh họa · Nguồn: Pexels</summary><p>Ảnh minh họa hoạt động chăm sóc sức khỏe, không phải nhân sự hoặc cơ sở thực tế của FoMed.</p><ul>{specialtyPhotos.map(photo => <li key={photo.key}><a href={photo.source} target="_blank" rel="noopener noreferrer">{photo.author} · {photo.alt}<span className="sr-only"> (mở ảnh gốc trong thẻ mới)</span></a></li>)}</ul></details>}
        </div>
      </section>

      <section id="doctors" className="home-section home-section-tinted scroll-mt-24">
        <div className={container}>
          <SectionHeading eyebrow="ĐỘI NGŨ BÁC SĨ" title="Tìm người đồng hành cùng sức khỏe" description="Xem hồ sơ, chuyên khoa và phí khám để lựa chọn phù hợp." to="/doctors" linkLabel="Tất cả bác sĩ" />
          {sectionState(0, doctors.length, 'bác sĩ') ?? <PublicCatalogCarousel label="bác sĩ" variant="doctors">{doctors.map((doctor) => <DoctorPreviewCard key={doctor.doctorId} doctor={doctor} />)}</PublicCatalogCarousel>}
        </div>
      </section>

      <section id="services" className="home-section scroll-mt-24">
        <div className={container}>
          <SectionHeading eyebrow="DỊCH VỤ & BẢNG GIÁ" title="Thông tin rõ ràng trước buổi khám" description="Tham khảo các dịch vụ đang có trong danh mục FoMed." to="/services" linkLabel="Xem tất cả dịch vụ" />
          {sectionState(2, services.length, 'dịch vụ') ?? <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{services.slice(0, 6).map((service) => <ServicePreviewCard key={service.id} service={service} />)}</div>}
          <p className="mt-5 text-xs leading-5 text-slate-500">Danh mục hiển thị thông tin tham khảo. Chỉ định dịch vụ cụ thể được thực hiện trong quá trình thăm khám.</p>
        </div>
      </section>

      <section id="about" className="home-section home-section-tinted scroll-mt-24">
        <div className={container}>
          <div className="home-about-grid">
          <figure className="home-about-visual"><div className="home-about-photo"><HomePhoto src={waitingRoomPhoto} alt="Ảnh minh họa: không gian chờ sáng, có ghế ngồi và quầy tiếp đón" width={1200} height={800} /></div><figcaption className="home-photo-credit">Không gian minh họa, không phải cơ sở FoMed · <a href="https://www.pexels.com/photo/waiting-room-in-a-hospital-8459996/" target="_blank" rel="noopener noreferrer">Los Muertos Crew / Pexels<span className="sr-only"> (mở trong thẻ mới)</span></a></figcaption></figure>
          <div><span className="text-xs font-bold uppercase tracking-[.15em] text-teal-700">VỀ FOMED</span><h2 className="mt-2 font-display text-2xl font-bold leading-snug text-slate-950">Không chỉ là một lịch hẹn</h2><p className="mt-4 text-sm leading-7 text-slate-600">FoMed kết nối việc đặt khám với quá trình theo dõi thông tin sau buổi khám. Tài khoản bệnh nhân giúp bạn quản lý những dữ liệu được ghi nhận trong hệ thống ở một nơi.</p><Link to="/register" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-teal-700 hover:text-teal-900">Tạo tài khoản bệnh nhân <ArrowRight className="size-4" /></Link></div>
          </div>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[
            { icon: CalendarCheck2, title: 'Quản lý lịch hẹn', text: 'Theo dõi thời gian khám và trạng thái lịch hẹn.', color: 'bg-teal-100 text-teal-800' },
            { icon: ClipboardList, title: 'Theo dõi bệnh án', text: 'Xem các hồ sơ khám được ghi nhận cho bạn.', color: 'bg-teal-100 text-teal-800' },
            { icon: FileText, title: 'Đơn thuốc & kết quả', text: 'Tra cứu thông tin trong hồ sơ khám của mình.', color: 'bg-teal-100 text-teal-800' },
            { icon: Wallet, title: 'Thông tin hóa đơn', text: 'Theo dõi hóa đơn và trạng thái thanh toán.', color: 'bg-teal-100 text-teal-800' },
          ].map(({ icon: Icon, title, text, color }) => <article key={title} className="home-benefit"><span className={'grid size-10 place-items-center rounded-xl ' + color}><Icon className="size-5" /></span><h3 className="mt-3 text-sm font-bold text-slate-900">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{text}</p></article>)}</div>
        </div>
      </section>

      <section id="how-it-works" className="home-section scroll-mt-24">
        <div className={container}><div className="max-w-2xl"><p className="home-eyebrow">BẮT ĐẦU THẬT ĐƠN GIẢN</p><h2 className="home-section-title">3 bước để đặt lịch khám</h2><p className="mt-3 text-sm leading-6 text-slate-600">Chuẩn bị cho buổi khám, từ việc lựa chọn bác sĩ đến gửi yêu cầu đặt lịch.</p></div>
          <div className="mt-7 grid gap-4 md:grid-cols-3">{[
            { number: '01', title: 'Tìm bác sĩ phù hợp', text: 'Tìm theo tên hoặc khám phá danh sách bác sĩ của từng chuyên khoa.', to: '/doctors', action: 'Khám phá bác sĩ', icon: Search },
            { number: '02', title: 'Đăng nhập tài khoản', text: 'Đăng nhập hoặc tạo tài khoản bệnh nhân để tiếp tục đặt lịch.', to: '/login', action: 'Đăng nhập', icon: ClipboardList },
            { number: '03', title: 'Chọn ngày & giờ khám', text: 'Chọn khung giờ còn trống và theo dõi trạng thái sau khi gửi yêu cầu.', to: appointmentUrl, action: 'Bắt đầu đặt lịch', icon: CalendarCheck2 },
          ].map(({ number, title, text, to, action, icon: Icon }) => <article key={number} className="home-step"><div className="flex items-center justify-between"><span className="home-step-number">{number}</span><Icon className="size-6 text-teal-700" /></div><h3 className="mt-5 text-base font-bold">{title}</h3><p className="mt-2 text-sm leading-7 text-slate-600">{text}</p><Link to={to} className="mt-auto inline-flex items-center gap-2 pt-5 text-sm font-semibold text-teal-800 hover:underline">{action} <ArrowRight className="size-4" /></Link></article>)}</div>
        </div>
      </section>

      <section id="faq" className="home-section home-section-tinted scroll-mt-24">
        <div className={container + ' grid gap-7 lg:grid-cols-[.7fr_1.3fr]'}><div><p className="text-xs font-bold uppercase tracking-[.15em] text-teal-700">GIẢI ĐÁP NHANH</p><h2 className="mt-2 font-display text-2xl font-bold text-slate-950">Bạn cần thêm thông tin?</h2><p className="mt-3 text-sm leading-6 text-slate-500">Một vài hướng dẫn trước khi bắt đầu sử dụng FoMed.</p><a href="#how-it-works" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-teal-700">Xem hướng dẫn đặt khám <ArrowRight className="size-4" /></a></div><div className="space-y-3">{faqs.map(({ question, answer }, index) => <details key={question} open={index === 0 ? true : undefined} className="group rounded-2xl border border-slate-200 bg-white"><summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 text-sm font-semibold leading-6 text-slate-800 [&::-webkit-details-marker]:hidden">{question}<ChevronDown className="size-4 shrink-0 text-teal-700 transition group-open:rotate-180" /></summary><p className="px-5 pb-5 text-sm leading-7 text-slate-500">{answer}</p></details>)}</div></div>
      </section>
    </main>
    <PublicFooter />
  </div>
}

function HomePhoto({ src, alt, width, height, priority = false }: { src: string; alt: string; width: number; height: number; priority?: boolean }) {
  const [failed, setFailed] = useState(false)
  if (failed) return <div className="home-photo-fallback" role="img" aria-label={alt + ' (hiện chưa tải được ảnh)'}><Stethoscope aria-hidden="true" className="size-12" /><span>Chủ động chăm sóc sức khỏe cùng FoMed</span></div>
  return <img className="home-stock-photo" src={src} alt={alt} width={width} height={height} loading={priority ? 'eager' : 'lazy'} fetchPriority={priority ? 'high' : 'auto'} decoding="async" onError={() => setFailed(true)} />
}

function SectionHeading({ eyebrow, title, description, to, linkLabel }: { eyebrow: string; title: string; description: string; to: string; linkLabel: string }) {
  return <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div className="max-w-2xl"><p className="home-eyebrow">{eyebrow}</p><h2 className="home-section-title">{title}</h2><p className="mt-3 text-sm leading-6 text-slate-600">{description}</p></div><Link to={to} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 self-start rounded-lg border border-teal-700 bg-transparent px-4 py-2.5 text-xs font-semibold text-teal-800 transition hover:bg-teal-700 hover:text-white sm:self-auto">{linkLabel}<ArrowRight className="size-4" /></Link></div>
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
