import { Toaster } from 'sonner'

export default function AppToaster() {
  return <Toaster position="top-right" theme="light" richColors closeButton visibleToasts={3}
    offset={{ top: 92, right: 24 }} mobileOffset={{ top: 88, right: 16, left: 16 }}
    containerAriaLabel="Thông báo" customAriaLabel="Thông báo"
    toastOptions={{ closeButtonAriaLabel: 'Đóng thông báo', style: {
      fontFamily: 'var(--font-sans)', fontSize: '14px', borderRadius: '14px',
    }, classNames: { title: 'break-words leading-6', description: 'break-words leading-5' } }} />
}
