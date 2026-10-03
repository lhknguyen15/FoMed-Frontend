import { KeyRound, UserRound } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'
import AppShell from '../../../components/AppShell'

const links = [
  { to: '/account/profile', label: 'Thông tin cá nhân', icon: UserRound },
  { to: '/account/change-password', label: 'Bảo mật', icon: KeyRound },
]

export default function AccountLayout() {
  return <AppShell>
    <header className="mb-5 sm:mb-7">
      <p className="text-xs font-bold uppercase tracking-[.16em] text-teal-700">Tài khoản của tôi</p>
      <h1 className="mt-1 font-display text-2xl font-bold text-slate-900 sm:text-3xl">Cài đặt tài khoản</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Quản lý thông tin cá nhân và bảo mật tài khoản FoMed.</p>
    </header>
    <div className="min-w-0">
      <nav aria-label="Điều hướng cài đặt tài khoản" className="-mx-1 flex min-w-0 gap-2 overflow-x-auto border-b border-slate-200 px-1">
        {links.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} className={({ isActive }) => `inline-flex min-h-11 shrink-0 items-center gap-2 border-b-2 px-3 text-sm font-semibold transition sm:px-4 ${isActive ? 'border-teal-700 text-teal-800' : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800'}`}>
          <Icon className="size-[17px]" />{label}
        </NavLink>)}
      </nav>
      <section className="min-w-0 pt-5 sm:pt-6"><Outlet /></section>
    </div>
  </AppShell>
}
