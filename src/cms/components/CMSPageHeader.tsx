import type { ReactNode } from 'react'

export default function CMSPageHeader({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="mb-1.5 text-xs font-bold uppercase tracking-[.16em] text-teal-700">Quản trị hệ thống</p><h1 className="font-display text-3xl font-bold tracking-tight text-slate-900">{title}</h1><p className="mt-1.5 text-sm text-slate-500">{description}</p></div>{action}</div>
}
