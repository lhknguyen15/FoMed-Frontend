import type { ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from '../../components/ui'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogTitle } from '../../components/ui/alert-dialog'

type Props = {
  title: string
  description: string
  children?: ReactNode
  confirmLabel: string
  submitting: boolean
  error?: string
  returnFocus?: HTMLElement | null
  onCancel: () => void
  onConfirm: () => Promise<void>
}

export default function CMSConfirmDialog({ title, description, children, confirmLabel, submitting, error, returnFocus, onCancel, onConfirm }: Props) {
  return <AlertDialog open onOpenChange={open => { if (!open && !submitting) onCancel() }}>
    <AlertDialogContent onEscapeKeyDown={event => { if (submitting) event.preventDefault() }} onCloseAutoFocus={event => {
      event.preventDefault()
      const target = returnFocus?.isConnected ? returnFocus : document.querySelector<HTMLElement>('[data-schedule-create]')
      target?.focus()
    }} aria-busy={submitting}>
      <div aria-hidden="true" className="mb-4 grid size-11 place-items-center rounded-2xl bg-rose-50 text-rose-700"><AlertTriangle className="size-6" /></div>
      <AlertDialogTitle>{title}</AlertDialogTitle>
      <AlertDialogDescription>{description}</AlertDialogDescription>
      {children && <div className="mt-4 break-words rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">{children}</div>}
      {error && <p role="alert" className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <AlertDialogCancel asChild><Button type="button" variant="secondary" disabled={submitting}>Giữ lại</Button></AlertDialogCancel>
        <AlertDialogAction asChild onClick={event => { event.preventDefault(); if (!submitting) void onConfirm() }}><Button type="button" disabled={submitting} className="bg-rose-700 text-white shadow-none hover:bg-rose-800">{submitting ? 'Đang xử lý…' : confirmLabel}</Button></AlertDialogAction>
      </div>
    </AlertDialogContent>
  </AlertDialog>
}
