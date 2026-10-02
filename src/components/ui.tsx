import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { ChevronDown, Search } from 'lucide-react'

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,.025),0_8px_30px_rgba(15,23,42,.035)] ${className}`}>{children}</section>
}

export function Button({ children, variant = 'primary', className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'danger' }) {
  const variants = {
    primary: 'bg-teal-700 text-white shadow-sm shadow-teal-900/10 hover:bg-teal-800',
    secondary: 'border border-slate-200 bg-white text-slate-700 hover:border-teal-200 hover:text-teal-800',
    ghost: 'text-slate-600 hover:bg-slate-100',
    danger: 'bg-rose-50 text-rose-700 hover:bg-rose-100',
  }
  return <button className={`inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-4 text-sm font-semibold transition [&>svg]:shrink-0 disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`} {...props}>{children}</button>
}

export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'success' | 'warning' | 'danger' | 'info' | 'neutral' }) {
  const tones = {
    success: 'bg-emerald-50 text-emerald-700 ring-emerald-600/10',
    warning: 'bg-amber-50 text-amber-700 ring-amber-600/10',
    danger: 'bg-rose-50 text-rose-700 ring-rose-600/10',
    info: 'bg-sky-50 text-sky-700 ring-sky-600/10',
    neutral: 'bg-slate-100 text-slate-600 ring-slate-500/10',
  }
  return <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${tones[tone]}`}>{children}</span>
}

export function SearchBox({ placeholder = 'Tìm kiếm...', value, onChange }: { placeholder?: string; value?: string; onChange?: (value: string) => void }) {
  return <label className="relative block min-w-0 flex-1">
    <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
    <input value={value} onChange={(e) => onChange?.(e.target.value)} placeholder={placeholder} className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10" />
  </label>
}

export function SelectBox({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <button className={`inline-flex h-10 items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-600 hover:border-slate-300 ${className}`}>{children}<ChevronDown className="size-4 text-slate-400" /></button>
}

export function Field({ label, placeholder, value, type = 'text', className = '' }: { label: string; placeholder?: string; value?: string; type?: string; className?: string }) {
  return <label className={`block ${className}`}>
    <span className="mb-2 block text-sm font-semibold text-slate-700">{label}</span>
    {type === 'textarea' ? <textarea defaultValue={value} placeholder={placeholder} rows={4} className="input-base resize-none" /> : <input type={type} defaultValue={value} placeholder={placeholder} className="input-base" />}
  </label>
}

export function PageTitle({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
  return <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
    <div>
      <p className="mb-1.5 text-xs font-bold uppercase tracking-[.16em] text-teal-700">{eyebrow}</p>
      <h1 className="font-display text-3xl font-bold tracking-tight text-slate-900">{title}</h1>
      <p className="mt-1.5 text-sm text-slate-500">{description}</p>
    </div>
    {action}
  </div>
}

export function EmptyState({ icon, title, body }: { icon: ReactNode; title: string; body: string }) {
  return <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center">
    <div className="mb-4 grid size-12 place-items-center rounded-2xl bg-teal-50 text-teal-700">{icon}</div>
    <h3 className="font-display font-bold text-slate-800">{title}</h3>
    <p className="mt-1 max-w-sm text-sm text-slate-500">{body}</p>
  </div>
}
