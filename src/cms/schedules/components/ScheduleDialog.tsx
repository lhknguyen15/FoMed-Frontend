import { useEffect, useId, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'

export default function ScheduleDialog({ title, busy, onClose, children }: { title: string; busy: boolean; onClose: () => void; children: ReactNode }) {
  const id = useId()
  const container = useRef<HTMLDivElement>(null)
  const busyRef = useRef(busy); busyRef.current = busy
  const closeRef = useRef(onClose); closeRef.current = onClose
  useEffect(() => {
    const previous = document.activeElement
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    container.current?.focus()
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); if (!busyRef.current) closeRef.current() }
      if (event.key !== 'Tab' || !container.current) return
      const items = Array.from(container.current.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),select:not(:disabled),[tabindex="0"]')).filter(item => !item.closest('fieldset:disabled'))
      const first = items[0]; const last = items.at(-1)
      if (!first || !last) { event.preventDefault(); container.current.focus(); return }
      if (event.shiftKey && (document.activeElement === first || document.activeElement === container.current)) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && (document.activeElement === last || document.activeElement === container.current)) { event.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', onKey)
    return () => { document.body.style.overflow = overflow; document.removeEventListener('keydown', onKey); if (previous instanceof HTMLElement && previous.isConnected) previous.focus() }
  }, [])
  return <div className="fixed inset-0 z-[80] overflow-y-auto bg-slate-950/40 p-4 backdrop-blur-sm"><div className="grid min-h-full place-items-center py-4">
    <div ref={container} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby={id} className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl outline-none sm:p-8">
      <header className="mb-5 flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.15em] text-teal-700">Lịch bác sĩ</p><h2 id={id} className="mt-1 font-display text-2xl font-bold">{title}</h2></div><button type="button" disabled={busy} onClick={onClose} aria-label="Đóng cửa sổ" className="grid size-9 shrink-0 place-items-center rounded-xl text-slate-400 hover:bg-slate-100 disabled:opacity-50"><X className="size-5" /></button></header>
      {children}
    </div>
  </div></div>
}
