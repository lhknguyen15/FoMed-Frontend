import { useEffect, useState, type ReactNode } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { Bell, ChevronDown, HelpCircle, LogOut, Menu, PanelLeftClose, Search, Settings, X } from 'lucide-react'
import { roleHome, roleNavigation } from '../data/navigation'
import type { Role } from '../types'
import { useAuth } from '../modules/auth/hooks/useAuth'
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

export default function AppShell({ children }: { children: ReactNode }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [role, setRole] = useState<Role>(() => detectRole(location.pathname))
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [roleOpen, setRoleOpen] = useState(false)
  const availableRoles = roleLabels.filter((label) => user?.roles.some((roleName) => roleName.toLowerCase() === apiRoleByLabel[label].toLowerCase()))

  useEffect(() => {
    setRole(detectRole(location.pathname))
    setMobileOpen(false)
  }, [location.pathname])

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
        <button className="text-slate-400 lg:hidden" onClick={() => setMobileOpen(false)}><X className="size-5" /></button>
      </div>

      <div className={`relative mx-3 mt-5 ${collapsed ? 'hidden lg:block' : ''}`}>
        <button onClick={() => setRoleOpen(!roleOpen)} className={`flex w-full items-center rounded-xl border border-slate-200 bg-slate-50 p-2 text-left hover:bg-slate-100 ${collapsed ? 'justify-center' : 'gap-3'}`}>
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-teal-100 text-xs font-extrabold text-teal-800">{role.slice(0, 2).toUpperCase()}</span>
          {!collapsed && <><span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold text-slate-800">{role}</span><span className="block text-[11px] text-slate-500">Không gian làm việc</span></span>{availableRoles.length > 1 && <ChevronDown className="size-4 text-slate-400" />}</>}
        </button>
        {roleOpen && <div className={`absolute z-50 mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl ${collapsed ? 'left-14 w-52' : 'inset-x-0'}`}>
          {availableRoles.map((item) => <button key={item} onClick={() => changeRole(item)} className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm ${item === role ? 'bg-teal-50 font-bold text-teal-800' : 'text-slate-600 hover:bg-slate-50'}`}><span className="size-1.5 rounded-full bg-current" />{item}</button>)}
        </div>}
      </div>

      <nav className="mt-5 flex-1 space-y-1 overflow-y-auto px-3">
        {!collapsed && <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[.18em] text-slate-400">Menu chính</p>}
        {roleNavigation[role].map(({ label, path, icon: Icon, badge }) => <NavLink key={path} to={path} title={collapsed ? label : undefined} className={({ isActive }) => `group flex h-11 items-center rounded-xl text-sm font-semibold transition ${collapsed ? 'justify-center px-2' : 'gap-3 px-3'} ${isActive ? 'bg-teal-700 text-white shadow-md shadow-teal-800/10' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}>
          <Icon className="size-[19px] shrink-0" strokeWidth={2} />
          {!collapsed && <span className="flex-1 truncate">{label}</span>}
          {!collapsed && badge && <span className="grid min-w-5 place-items-center rounded-full bg-white/20 px-1.5 py-0.5 text-[10px]">{badge}</span>}
        </NavLink>)}
      </nav>

      <div className="border-t border-slate-100 p-3">
        <button className={`flex h-10 w-full items-center rounded-xl text-sm font-semibold text-slate-500 hover:bg-slate-100 ${collapsed ? 'justify-center' : 'gap-3 px-3'}`}><HelpCircle className="size-[18px]" />{!collapsed && 'Trợ giúp & hỗ trợ'}</button>
        <button onClick={() => setCollapsed(!collapsed)} className="mt-1 hidden h-10 w-full items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 lg:flex"><PanelLeftClose className={`size-[18px] transition ${collapsed ? 'rotate-180' : ''}`} /></button>
      </div>
    </aside>

    <div className={`transition-all duration-300 ${collapsed ? 'lg:pl-[84px]' : 'lg:pl-[264px]'}`}>
      <header className="sticky top-0 z-20 flex h-[76px] items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur-xl sm:px-7">
        <div className="flex items-center gap-3">
          <button className="grid size-10 place-items-center rounded-xl border border-slate-200 text-slate-600 lg:hidden" onClick={() => setMobileOpen(true)}><Menu className="size-5" /></button>
          <label className="relative hidden w-72 md:block">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input placeholder="Tìm bệnh nhân, lịch hẹn..." className="h-10 w-full rounded-xl bg-slate-100 pl-10 pr-3 text-sm outline-none transition focus:bg-white focus:ring-2 focus:ring-teal-600/20" />
          </label>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <button className="relative grid size-10 place-items-center rounded-xl text-slate-500 hover:bg-slate-100"><Bell className="size-5" /><span className="absolute right-2 top-2 size-2 rounded-full border-2 border-white bg-rose-500" /></button>
          <button onClick={() => navigate('/account/change-password')} title="Đổi mật khẩu" className="hidden size-10 place-items-center rounded-xl text-slate-500 hover:bg-slate-100 sm:grid"><Settings className="size-5" /></button>
          <span className="mx-1 hidden h-7 w-px bg-slate-200 sm:block" />
          <div className="flex items-center gap-2.5">
            <span className="grid size-10 place-items-center rounded-full bg-gradient-to-br from-amber-100 to-orange-200 text-sm font-extrabold text-amber-800">{user?.fullName.split(' ').map((part) => part[0]).slice(-2).join('').toUpperCase() || 'FM'}</span>
            <span className="hidden text-left md:block"><span className="block max-w-36 truncate text-sm font-bold text-slate-800">{user?.fullName || 'Người dùng FoMed'}</span><span className="block text-[11px] text-slate-500">{role}</span></span>
            <button onClick={() => { logout(); navigate('/login', { replace: true }) }} title="Đăng xuất" className="hidden text-slate-400 hover:text-rose-600 sm:block"><LogOut className="size-4" /></button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-[1540px] p-4 sm:p-7 lg:p-8">{children}</main>
    </div>
  </div>
}
