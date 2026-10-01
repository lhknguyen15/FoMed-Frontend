import type { InputHTMLAttributes, ReactNode } from 'react'

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  icon: ReactNode
  error?: string
  trailing?: ReactNode
}

export function AuthField({ label, icon, error, trailing, className = '', ...props }: Props) {
  return <label className="block">
    <span className="mb-2 block text-sm font-semibold text-slate-700">{label}</span>
    <span className="relative block">
      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">{icon}</span>
      <input {...props} className={`h-12 w-full rounded-xl border bg-white pl-12 pr-12 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 ${error ? 'border-rose-300 ring-4 ring-rose-100' : 'border-slate-200 focus:border-teal-600 focus:ring-4 focus:ring-teal-600/10'} ${className}`} />
      {trailing && <span className="absolute right-4 top-1/2 -translate-y-1/2">{trailing}</span>}
    </span>
    {error && <span className="mt-1.5 block text-xs font-medium text-rose-600">{error}</span>}
  </label>
}
