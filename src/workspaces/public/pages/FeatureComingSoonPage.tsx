import { useEffect, useRef } from 'react'
import { ArrowLeft, ArrowRight, CalendarDays, Clock3, MessageCircle, Newspaper } from 'lucide-react'
import { Link } from 'react-router-dom'
import PublicHeader from '../components/PublicHeader'
import PublicFooter from '../components/PublicFooter'

type Feature = 'consultation' | 'news'
const features = {
  consultation: {
    title: 'Tư vấn trực tuyến',
    description: 'FoMed đang chuẩn bị trải nghiệm tư vấn trực tuyến. Hiện bạn chưa thể gửi yêu cầu tư vấn hoặc trao đổi với bác sĩ tại đây.',
    icon: MessageCircle,
  },
  news: {
    title: 'Tin tức y tế',
    description: 'FoMed đang xây dựng chuyên mục tin tức y tế. Hiện chưa có bài viết được đăng trong chuyên mục này.',
    icon: Newspaper,
  },
}

export default function FeatureComingSoonPage({ feature }: { feature: Feature }) {
  const { title, description, icon: Icon } = features[feature]
  const headingRef = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    const previousTitle = document.title
    document.title = title + ' · FoMed'
    window.scrollTo({ top: 0, behavior: 'auto' })
    headingRef.current?.focus({ preventScroll: true })
    return () => { document.title = previousTitle }
  }, [title])
  return <div className="min-h-screen bg-[#f8faf9] text-slate-900">
    <PublicHeader />
    <main className="relative overflow-hidden border-b border-teal-100 px-4 py-14 sm:px-6 sm:py-20">
      <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-0 -z-0 size-[480px] -translate-x-1/2 rounded-full bg-teal-100/40 blur-3xl" />
      <section aria-labelledby="coming-soon-title" className="relative mx-auto max-w-2xl rounded-3xl border border-white bg-white/90 px-6 py-10 text-center shadow-xl shadow-teal-900/5 sm:px-12 sm:py-12">
        <span className="mx-auto grid size-20 place-items-center rounded-3xl border border-teal-100 bg-teal-50 text-teal-700"><Icon className="size-9" aria-hidden="true" /></span>
        <p className="mt-6 text-xs font-semibold uppercase tracking-widest text-teal-700">{title}</p>
        <h1 ref={headingRef} tabIndex={-1} id="coming-soon-title" className="mt-3 font-display text-3xl font-extrabold leading-tight tracking-tight text-slate-950 outline-none sm:text-4xl">Chức năng đang phát triển</h1>
        <p className="mx-auto mt-5 max-w-lg text-sm leading-7 text-slate-600 sm:text-base">{description}</p>
        <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-slate-50 px-4 py-2 text-xs font-medium text-slate-500"><Clock3 className="size-4" aria-hidden="true" /> Chưa có thời gian ra mắt chính thức</p>
        <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
          <Link to="/doctors" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-teal-700 px-5 text-sm font-semibold text-white hover:bg-teal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2"><CalendarDays className="size-4" aria-hidden="true" /> Tìm bác sĩ để đặt khám <ArrowRight className="size-4" aria-hidden="true" /></Link>
          <Link to="/" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 text-sm font-semibold text-slate-600 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2"><ArrowLeft className="size-4" aria-hidden="true" /> Về trang chủ</Link>
        </div>
      </section>
    </main>
    <PublicFooter />
  </div>
}
