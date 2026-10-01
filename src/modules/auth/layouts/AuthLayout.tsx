import { Outlet } from 'react-router-dom'
import { CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react'
import logo from '../../../assets/images/FoMed_Logo.png'

const benefits = [
  'Quản lý lịch khám tập trung',
  'Theo dõi hồ sơ sức khỏe an toàn',
  'Kết nối xuyên suốt toàn phòng khám',
]

export default function AuthLayout() {
  return <main className="grid min-h-screen bg-[#f4f8f7] lg:grid-cols-[1.04fr_.96fr]">
    <section className="relative hidden overflow-hidden bg-[#075f59] px-12 py-10 text-white lg:flex lg:flex-col lg:justify-between xl:px-16">
      <div className="absolute -right-48 -top-52 size-[580px] rounded-full bg-emerald-300/15 blur-3xl" />
      <div className="absolute -bottom-56 -left-44 size-[600px] rounded-full bg-cyan-300/10 blur-3xl" />
      <div className="absolute inset-0 opacity-[.05] [background-image:linear-gradient(rgba(255,255,255,.8)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.8)_1px,transparent_1px)] [background-size:52px_52px]" />

      <div className="relative flex items-center gap-3">
        <span className="grid size-12 place-items-center rounded-2xl bg-white/95 shadow-lg"><img src={logo} alt="FoMed" className="size-10 object-contain" /></span>
        <span><strong className="font-display block text-2xl font-extrabold tracking-tight">FoMed</strong><small className="text-[10px] font-semibold uppercase tracking-[.18em] text-teal-100/65">Clinic management</small></span>
      </div>

      <div className="relative max-w-xl">
        <span className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold backdrop-blur"><Sparkles className="size-4 text-lime-300" /> Một hành trình chăm sóc liền mạch</span>
        <h1 className="font-display text-5xl font-bold leading-[1.13] tracking-tight xl:text-[58px]">Sức khỏe của bạn,<br /><span className="text-[#96ecd1]">được chăm sóc tốt hơn.</span></h1>
        <p className="mt-6 max-w-lg text-base leading-8 text-teal-50/70">FoMed kết nối bệnh nhân và đội ngũ y tế trên một nền tảng an toàn, rõ ràng và thuận tiện.</p>
        <div className="mt-9 space-y-3">{benefits.map((item) => <p key={item} className="flex items-center gap-3 text-sm font-medium text-teal-50/85"><CheckCircle2 className="size-5 text-lime-300" />{item}</p>)}</div>
      </div>

      <p className="relative flex items-center gap-2 text-xs text-teal-50/50"><ShieldCheck className="size-4" /> Dữ liệu được bảo vệ theo đúng vai trò truy cập</p>
    </section>
    <section className="flex min-h-screen items-center justify-center p-5 sm:p-10"><Outlet /></section>
  </main>
}
