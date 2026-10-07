import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, useLocation } from 'react-router-dom'
import PublicHeader from '../../src/workspaces/public/components/PublicHeader'
import '../../src/index.css'

// Isolated navigation preview: no session, API, or real patient data.
export function Preview() {
  const { pathname } = useLocation()
  return <>
    <PublicHeader />
    <main className="min-h-screen bg-teal-50/60 px-5 py-16 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <p className="text-xs font-semibold uppercase tracking-widest text-teal-700">FoMed · Kiểm tra giao diện</p>
        <h1 className="mt-4 font-display text-3xl font-bold text-slate-900 sm:text-5xl">Chăm sóc sức khỏe,<br />bắt đầu từ sự an tâm.</h1>
        <p className="mt-5 max-w-lg text-sm leading-7 text-slate-600">Trang riêng để kiểm tra thanh điều hướng trên máy tính và điện thoại. Không gửi yêu cầu đến máy chủ.</p>
        <p className="mt-8 text-sm text-slate-500">Đường dẫn đang xem: <span data-testid="current-path">{pathname}</span></p>
      </div>
    </main>
  </>
}

createRoot(document.getElementById('root')!).render(<StrictMode><BrowserRouter><Preview /></BrowserRouter></StrictMode>)
