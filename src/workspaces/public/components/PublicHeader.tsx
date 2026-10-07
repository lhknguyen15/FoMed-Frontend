import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { ArrowRight, CalendarDays, ChevronDown, Layers3, Menu, Stethoscope, X } from 'lucide-react'
import logo from '../../../assets/images/FoMed_Logo.png'

const bookingOptions = [
  { to: '/doctors', label: 'Bác sĩ', description: 'Chọn bác sĩ phù hợp với bạn', icon: Stethoscope },
  { to: '/specialties', label: 'Chuyên khoa', description: 'Tìm hiểu lĩnh vực cần thăm khám', icon: Layers3 },
  { to: '/services', label: 'Dịch vụ', description: 'Tham khảo dịch vụ và phí khám', icon: CalendarDays },
]
const navigation = [
  { to: '/online-consultation', label: 'Tư vấn trực tuyến' },
  { to: '/health-news', label: 'Tin tức y tế' },
]
const focusStyle = ' focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2'
type Panel = 'booking' | null

export default function PublicHeader() {
  const [open, setOpen] = useState(false)
  const [panel, setPanel] = useState<Panel>(null)
  const headerRef = useRef<HTMLElement>(null)
  const bookingRef = useRef<HTMLButtonElement>(null)
  const mobileBookingRef = useRef<HTMLButtonElement>(null)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const location = useLocation()
  const bookingActive = bookingOptions.some(({ to }) => location.pathname === to || location.pathname.startsWith(to + '/'))
  const closeAll = () => { setOpen(false); setPanel(null) }
  const togglePanel = (next: Panel) => setPanel((current) => current === next ? null : next)

  useEffect(() => {
    setOpen(false)
    setPanel(null)
  }, [location.pathname, location.search, location.hash])

  useEffect(() => {
    if (!open && !panel) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      if (panel) {
        setPanel(null)
        const trigger = open ? mobileBookingRef : bookingRef
        trigger.current?.focus()
      } else {
        setOpen(false)
        menuButtonRef.current?.focus()
      }
    }
    const closeOutside = (event: PointerEvent) => {
      if (event.target instanceof Node && !headerRef.current?.contains(event.target)) {
        setOpen(false)
        setPanel(null)
      }
    }
    const breakpoint = window.matchMedia('(min-width: 1024px)')
    const closeOnResize = () => { setOpen(false); setPanel(null) }
    document.addEventListener('keydown', closeOnEscape)
    document.addEventListener('pointerdown', closeOutside)
    breakpoint.addEventListener('change', closeOnResize)
    return () => {
      document.removeEventListener('keydown', closeOnEscape)
      document.removeEventListener('pointerdown', closeOutside)
      breakpoint.removeEventListener('change', closeOnResize)
    }
  }, [open, panel])

  const bookingLinks = bookingOptions.map(({ to, label, description, icon: Icon }) => (
    <NavLink key={to} to={to} aria-label={label} onClick={closeAll} className={({ isActive }) =>
      'flex items-center gap-3 rounded-xl p-3 transition-colors ' +
      (isActive ? 'bg-teal-50 text-teal-800' : 'text-slate-700 hover:bg-slate-50') + focusStyle
    }>
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-teal-50 text-teal-700"><Icon className="size-5" aria-hidden="true" /></span>
      <span className="min-w-0"><span className="block text-sm font-semibold">{label}</span><span className="mt-1 block text-xs leading-5 text-slate-500">{description}</span></span>
      <ArrowRight className="ml-auto size-4 shrink-0 text-teal-600" aria-hidden="true" />
    </NavLink>
  ))

  return (
    <header ref={headerRef} onBlurCapture={(event) => { if (event.relatedTarget instanceof Node && !event.currentTarget.contains(event.relatedTarget)) closeAll() }} className="public-header sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 shadow-[0_4px_24px_-16px_rgba(15,118,110,0.25)] backdrop-blur-xl">
      <div className="flex h-[72px] w-full items-center gap-2 px-4 sm:gap-4 sm:px-6">
        <Link to="/" onClick={closeAll} aria-label="FoMed - trang chủ" className={'flex shrink-0 items-center gap-2 rounded-xl sm:gap-3' + focusStyle}>
          <img src={logo} alt="" width={44} height={44} className="size-9 object-contain sm:size-11" />
          <span className="block font-display text-xl font-extrabold leading-tight tracking-tight text-slate-950 sm:text-2xl">Fo<span className="text-teal-700">Med</span></span>
        </Link>

        <div className="ml-auto flex shrink-0 items-center gap-2 lg:gap-5 xl:gap-8">
        <nav className="hidden items-center gap-1 lg:flex xl:gap-4" aria-label="Điều hướng chính">
          <div className="relative">
            <button ref={bookingRef} type="button" aria-expanded={panel === 'booking'} aria-controls="public-booking-menu" onClick={() => togglePanel('booking')} className={'public-nav-item inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl px-2.5 py-3 transition-colors xl:px-4 ' + (bookingActive || panel === 'booking' ? 'bg-teal-50 text-teal-800' : 'text-slate-600 hover:bg-slate-50 hover:text-teal-800') + focusStyle}>
              Đặt khám theo <ChevronDown className={'size-4 transition-transform ' + (panel === 'booking' ? 'rotate-180' : '')} aria-hidden="true" />
            </button>
            <div id="public-booking-menu" hidden={panel !== 'booking'} className="absolute left-0 top-full mt-3 w-[340px] rounded-2xl border border-slate-100 bg-white p-2 shadow-xl shadow-slate-900/10">
              <p className="px-3 pb-2 pt-3 text-[10px] font-semibold uppercase tracking-widest text-slate-400">Chọn cách tìm lịch khám</p>
              {bookingLinks}
            </div>
          </div>
          {navigation.map(({ to, label }) => (
            <NavLink key={to} to={to} onClick={closeAll} className={({ isActive }) =>
              'public-nav-item whitespace-nowrap rounded-xl px-2.5 py-3 transition-colors xl:px-4 ' +
              (isActive ? 'bg-teal-50 text-teal-800' : 'text-slate-600 hover:bg-slate-50 hover:text-teal-800') + focusStyle
            }>{label}</NavLink>
          ))}
        </nav>

          <Link onClick={closeAll} to="/login" className={'public-nav-item inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-xl border border-teal-600 bg-white px-3 text-teal-700 transition-colors hover:bg-teal-50 sm:px-5' + focusStyle}>Đăng nhập</Link>
          <button ref={menuButtonRef} className={'grid size-11 place-items-center rounded-xl border border-slate-200 text-slate-700 transition-colors hover:bg-teal-50 lg:hidden' + focusStyle} type="button" aria-label={open ? 'Đóng menu' : 'Mở menu'} aria-expanded={open} aria-controls="public-mobile-menu" onClick={() => { setOpen((value) => !value); setPanel(null) }}>
            {open ? <X className="size-5" aria-hidden="true" /> : <Menu className="size-5" aria-hidden="true" />}
          </button>
        </div>
      </div>

      <nav id="public-mobile-menu" hidden={!open} className="max-h-[calc(100dvh-72px)] overflow-y-auto border-t border-slate-100 bg-white px-4 pb-5 pt-3 sm:px-6 lg:hidden" aria-label="Menu di động">
        <div className="mx-auto grid max-w-7xl gap-1">
          <button ref={mobileBookingRef} type="button" aria-expanded={panel === 'booking'} aria-controls="public-mobile-booking-menu" onClick={() => togglePanel('booking')} className={'public-nav-item flex items-center justify-between rounded-xl px-4 py-3.5 ' + (bookingActive || panel === 'booking' ? 'bg-teal-50 text-teal-800' : 'text-slate-700 hover:bg-slate-50') + focusStyle}>
            Đặt khám theo <ChevronDown className={'size-4 transition-transform ' + (panel === 'booking' ? 'rotate-180' : '')} aria-hidden="true" />
          </button>
          <div id="public-mobile-booking-menu" hidden={panel !== 'booking'} className="rounded-2xl border border-teal-100/70 p-1">{bookingLinks}</div>
          {navigation.map(({ to, label }) => (
            <NavLink key={to} onClick={closeAll} to={to} className={({ isActive }) =>
              'public-nav-item flex items-center justify-between rounded-xl px-4 py-3.5 transition-colors ' +
              (isActive ? 'bg-teal-50 text-teal-800' : 'text-slate-700 hover:bg-slate-50') + focusStyle
            }>{label}<ArrowRight className="size-4 text-teal-600" aria-hidden="true" /></NavLink>
          ))}
        </div>
      </nav>
    </header>
  )
}
