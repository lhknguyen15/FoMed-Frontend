import type { ComponentProps } from 'react'
import * as AlertDialogPrimitive from '@radix-ui/react-alert-dialog'

// shadcn/ui Alert Dialog composition, adapted to FoMed's existing Tailwind tokens.
// https://ui.shadcn.com/docs/components/radix/alert-dialog (MIT)
export const AlertDialog = AlertDialogPrimitive.Root
export const AlertDialogAction = AlertDialogPrimitive.Action
export const AlertDialogCancel = AlertDialogPrimitive.Cancel

export function AlertDialogContent({ className = '', children, ...props }: ComponentProps<typeof AlertDialogPrimitive.Content>) {
  return <AlertDialogPrimitive.Portal>
    <AlertDialogPrimitive.Overlay className="fixed inset-0 z-[90] bg-slate-950/45 backdrop-blur-sm" />
    <AlertDialogPrimitive.Content className={`fixed left-1/2 top-1/2 z-[91] max-h-[calc(100dvh_-_2rem)] w-[calc(100%_-_2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl outline-none sm:p-8 ${className}`} {...props}>
      {children}
    </AlertDialogPrimitive.Content>
  </AlertDialogPrimitive.Portal>
}

export function AlertDialogTitle({ className = '', ...props }: ComponentProps<typeof AlertDialogPrimitive.Title>) {
  return <AlertDialogPrimitive.Title className={`font-display text-xl font-bold text-slate-900 ${className}`} {...props} />
}

export function AlertDialogDescription({ className = '', ...props }: ComponentProps<typeof AlertDialogPrimitive.Description>) {
  return <AlertDialogPrimitive.Description className={`mt-2 text-sm leading-6 text-slate-600 ${className}`} {...props} />
}
