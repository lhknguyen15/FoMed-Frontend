import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { ChevronDown, KeyRound, LogOut, Menu, PanelLeftClose, UserRound, X } from 'lucide-react'
import { navigationCountLabel, roleHome, roleNavigation, validNavigationCount } from '../data/navigation'
import type { NavigationCounts, Role } from '../types'
import { useAuth } from '../features/auth/hooks/useAuth'
import logo from '../assets/images/FoMed_Logo.png'

const roleLabels: Role[] = ['Bệnh nhân', 'Lễ tân', 'Bác sĩ', 'Kỹ thuật viên', 'Dược sĩ', 'Quản trị']
const apiRoleByLabel: Record<Role, string> = { 'Bệnh nhân': 'Patient', 'Lễ tân': 'Receptionist', 'Bác sĩ': 'Doctor', 'Kỹ thuật viên': 'Technician', 'Dược sĩ': 'Pharmacist', 'Quản trị': 'Admin' }

function detectRole(path: string): Role {
  if (path.startsWith('/doctor')) return 'Bác sĩ'
  if (path.startsWith('/technician')) return 'Kỹ thuật viên'
  if (path.startsWith('/pharmacy')) return 'Dược sĩ'
  if (path.startsWith('/admin')) return 'Quản trị'
  if (path.startsWith('/reception')) return 'Lễ tân'
  return 'Bệnh nhân'
}

function initialRole(path: string): Role {
  if (!path.startsWith('/account')) return detectRole(path)
  const savedRole = sessionStorage.getItem('fomed_active_role')
  return roleLabels.includes(savedRole as Role) ? savedRole as Role : 'Bệnh nhân'
}

export default function AppShell({ children, navigationCounts }: { children: ReactNode; navigationCounts?: NavigationCounts }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [role, setRole] = useState<Role>(() => initialRole(location.pathname))
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [roleOpen, setRoleOpen] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const profileName = user?.fullName ?? ''
  const profileMenuRef = useRef<HTMLDivElement>(null)
  const roleButtonRef = useRef<HTMLButtonElement>(null)
  const roleChoicesId = useId()
  const availableRoles = roleLabels.filter((label) => user?.roles.some((roleName) => roleName.toLowerCase() === apiRoleByLabel[label].toLowerCase()))

  useEffect(() => {
    if (!location.pathname.startsWith('/account')) {
      const nextRole = detectRole(location.pathname)
      setRole(nextRole)
      sessionStorage.setItem('fomed_active_role', nextRole)
    } else {
      const validRoles = roleLabels.filter((label) => user?.roles.some((roleName) => roleName.toLowerCase() === apiRoleByLabel[label].toLowerCase()))
      if (!validRoles.includes(role) && validRoles.length > 0) {
        setRole(validRoles[0])
        sessionStorage.setItem('fomed_active_role', validRoles[0])
      }
    }
    setMobileOpen(false)
  }, [location.pathname, role, user])

  useEffect(() => {
    if (!profileMenuOpen) return
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (event.target instanceof Node && !profileMenuRef.current?.contains(event.target)) setProfileMenuOpen(false)
    }
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setProfileMenuOpen(false) }
    document.addEventListener('pointerdown', closeOnOutsideClick)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [profileMenuOpen])

  const changeRole = (nextRole: Role) => {
    setRole(nextRole)
    setRoleOpen(false)
    navigate(roleHome[nextRole])
  }

  return <div className="min-h-screen bg-[#f6f8f8] text-slate-800">
    {mobileOpen && <button aria-label="Đóng menu" className="fixed inset-0 z-30 bg-slate-950/30 backdrop-blur-sm lg:hidden" onClick={() => setMobileOpen(false)} />}
    <aside className={`fixed inset-y-0 left-0 z-40 flex flex-col border-r border-slate-200 bg-white transition-all duration-300 ${collapsed ? 'lg:w-[84px]' : 'lg:w-[264px]'} ${mobileOpen ? 'w-[280px] translate-x-0' : 'w-[280px] -translate-x-full lg:translate-x-0'}`}>
      <div className={`flex h-[76px] items-center border-b border-slate-100 ${collapsed ? 'justify-center px-3' : 'justify-between px-6'}`}>
        <button onClick={() => navigate(roleHome[role])} className="flex items-center gap-3 overflow-hidden">
          <span className="grid size-10 shrink-0 place-items-center rounded-[14px] bg-white shadow-md shadow-teal-900/10"><img src={logo} alt="FoMed" className="size-9 object-contain" /></span>
          {!collapsed && <span className="font-display text-[22px] font-extrabold tracking-tight text-slate-900">Fo<span className="text-teal-700">Med</span></span>}
        </button>
        <button aria-label="Đóng thanh điều hướng" className="text-slate-400 lg:hidden" onClick={() => setMobileOpen(false)}><X className="size-5" /></button>
      </div>

      <div onKeyDown={(event) => { if (event.key === 'Escape' && roleOpen) { event.stopPropagation(); setRoleOpen(false); roleButtonRef.current?.focus() } }} className={`relative mx-3 mt-5 ${collapsed ? 'hidden lg:block' : ''}`}>
        <button ref={roleButtonRef} type="button" aria-label={`Chọn vai trò: ${role}`} aria-expanded={roleOpen} aria-controls={roleChoicesId} title={collapsed ? `Chọn vai trò: ${role}` : undefined} onClick={() => setRoleOpen(!roleOpen)} className={`flex w-full items-center rounded-xl border border-slate-200 bg-slate-50 p-2 text-left hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 ${collapsed ? 'justify-center' : 'gap-3'}`}>
          <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-lg bg-teal-100 text-teal-800"><UserRound className="size-5" strokeWidth={2} /></span>
          {!collapsed && <><span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold text-slate-800">{role}</span><span className="block text-[11px] text-slate-500">Không gian làm việc</span></span>{availableRoles.length > 1 && <ChevronDown className="size-4 text-slate-400" />}</>}
        </button>
        {roleOpen && <div id={roleChoicesId} className={`absolute z-50 mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl ${collapsed ? 'left-14 w-52' : 'inset-x-0'}`}>
          {availableRoles.map((item) => <button key={item} onClick={() => changeRole(item)} className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm ${item === role ? 'bg-teal-50 font-bold text-teal-800' : 'text-slate-600 hover:bg-slate-50'}`}><span className="size-1.5 rounded-full bg-current" />{item}</button>)}
        </div>}
      </div>

      <nav className="mt-5 flex-1 space-y-1 overflow-y-auto px-3">
        {!collapsed && <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[.18em] text-slate-400">Menu chính</p>}
        {roleNavigation[role].map(({ label, path, icon: Icon, countKey }) => {
          const count = validNavigationCount(countKey ? navigationCounts?.[countKey] : undefined)
          const countLabel = countKey && count !== null ? navigationCountLabel(countKey, count) : ''
          const accessibleLabel = countLabel ? `${label}: ${countLabel}` : label
          return <NavLink key={path} to={path} end={path === roleHome[role]} aria-label={accessibleLabel} title={collapsed ? accessibleLabel : undefined} className={({ isActive }) => `group flex h-11 items-center rounded-xl text-sm font-semibold transition ${collapsed ? 'justify-center px-2' : 'gap-3 px-3'} ${isActive ? 'bg-teal-700 text-white shadow-md shadow-teal-800/10' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}>
          <Icon className="size-[19px] shrink-0" strokeWidth={2} />
          {!collapsed && <span className="min-w-0 flex-1 truncate whitespace-nowrap">{label}</span>}
          {!collapsed && count !== null && <span aria-label={countLabel} title={countLabel} className="grid min-w-5 shrink-0 place-items-center rounded-full bg-white/20 px-1.5 py-0.5 text-[10px]">{count > 99 ? '99+' : count}</span>}
        </NavLink>})}
      </nav>

      <div className="border-t border-slate-100 p-3">
        <button onClick={() => setCollapsed(!collapsed)} aria-label={collapsed ? 'Mở rộng thanh điều hướng' : 'Thu gọn thanh điều hướng'} title={collapsed ? 'Mở rộng thanh điều hướng' : 'Thu gọn thanh điều hướng'} className="hidden h-10 w-full items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 lg:flex"><PanelLeftClose className={`size-[18px] transition ${collapsed ? 'rotate-180' : ''}`} /></button>
      </div>
    </aside>

    <div className={`transition-all duration-300 ${collapsed ? 'lg:pl-[84px]' : 'lg:pl-[264px]'}`}>
      <header className="sticky top-0 z-20 flex h-[76px] items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur-xl sm:px-7">
        <div className="flex items-center gap-3">
          <button aria-label="Mở thanh điều hướng" className="grid size-10 place-items-center rounded-xl border border-slate-200 text-slate-600 lg:hidden" onClick={() => setMobileOpen(true)}><Menu className="size-5" /></button>
          <span className="hidden text-sm font-semibold text-slate-500 sm:block">Không gian {role.toLocaleLowerCase('vi')}</span>
        </div>
        <div ref={profileMenuRef} className="relative">
          <button type="button" aria-label="Mở menu hồ sơ tài khoản" aria-haspopup="menu" aria-expanded={profileMenuOpen} onClick={() => setProfileMenuOpen((open) => !open)} className="flex max-w-[min(18rem,65vw)] items-center gap-2 rounded-xl p-1.5 text-left hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 sm:gap-3 sm:px-2">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-amber-100 to-orange-200 text-sm font-extrabold text-amber-800">{profileName.split(' ').map((part) => part[0]).slice(-2).join('').toUpperCase() || 'FM'}</span>
            <span className="hidden min-w-0 text-left sm:block"><span className="block max-w-40 truncate text-sm font-bold text-slate-800">{profileName || 'Người dùng FoMed'}</span><span className="block text-[11px] text-slate-500">{role}</span></span>
            <ChevronDown className={`hidden size-4 shrink-0 text-slate-400 transition sm:block ${profileMenuOpen ? 'rotate-180' : ''}`} />
          </button>
          {profileMenuOpen && <div role="menu" aria-label="Menu tài khoản" className="absolute right-0 top-full z-50 mt-2 w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-900/10">
            <div className="border-b border-slate-100 px-3 py-2.5 sm:hidden"><p className="truncate text-sm font-bold text-slate-800">{profileName || 'Người dùng FoMed'}</p><p className="mt-0.5 text-xs text-slate-500">{role}</p></div>
            <button type="button" role="menuitem" onClick={() => { setProfileMenuOpen(false); navigate('/account/profile') }} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium text-slate-700 hover:bg-slate-50"><UserRound className="size-[18px] text-teal-700" /><span><span className="block font-semibold">Quản lý hồ sơ</span><span className="mt-0.5 block text-xs font-normal text-slate-500">Thông tin cá nhân và liên hệ</span></span></button>
            <button type="button" role="menuitem" onClick={() => { setProfileMenuOpen(false); navigate('/account/change-password') }} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium text-slate-700 hover:bg-slate-50"><KeyRound className="size-[18px] text-slate-500" />Đổi mật khẩu</button>
            <div className="my-1 border-t border-slate-100" />
            <button type="button" role="menuitem" onClick={() => { setProfileMenuOpen(false); sessionStorage.removeItem('fomed_active_role'); logout(); navigate('/login', { replace: true }) }} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold text-rose-600 hover:bg-rose-50"><LogOut className="size-[18px]" />Đăng xuất</button>
          </div>}
        </div>
      </header>
      <main className="mx-auto max-w-[1540px] p-4 sm:p-7 lg:p-8">{children}</main>
    </div>
  </div>
}
