import { Link } from 'react-router-dom'
import { ArrowRight, Baby, Ear, FlaskConical, HeartPulse, ScanLine, Sparkles, Stethoscope } from 'lucide-react'
import type { CatalogService, CatalogSpecialty, PublicDoctor } from '../../../features/catalogs/types/catalog'
import DoctorAvatar from '../../../features/doctors/components/DoctorAvatar'

const formatCatalogPrice = (price: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(price)

function specialtyIcon(name: string) {
  const text = name.toLocaleLowerCase('vi')
  if (text.includes('nhi')) return Baby
  if (text.includes('tai') || text.includes('họng')) return Ear
  if (text.includes('tim')) return HeartPulse
  if (text.includes('da liễu')) return Sparkles
  return Stethoscope
}

export function SpecialtyPreviewCard({ specialty, index }: { specialty: CatalogSpecialty; index: number }) {
  const Icon = specialtyIcon(specialty.name)
  const tone = ['bg-sky-100 text-sky-700', 'bg-rose-100 text-rose-700', 'bg-violet-100 text-violet-700', 'bg-amber-100 text-amber-700', 'bg-teal-100 text-teal-700'][index % 5]
  return <Link to={`/doctors?specialtyId=${specialty.specialtyId}`} className="group flex h-full flex-col items-start rounded-2xl border border-teal-100 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:border-teal-300 hover:shadow-md motion-reduce:transform-none sm:p-5">
    <span className={`grid size-14 place-items-center rounded-2xl ${tone}`}><Icon className="size-7" /></span>
    <h3 className="mt-4 text-sm font-bold leading-6 text-slate-900 group-hover:text-teal-800 sm:text-base">{specialty.name}</h3>
    <span className="mt-auto inline-flex items-center gap-1.5 pt-3 text-xs font-semibold text-slate-500 group-hover:text-teal-700">Khám phá bác sĩ <ArrowRight className="size-3.5" /></span>
  </Link>
}

export function DoctorPreviewCard({ doctor }: { doctor: PublicDoctor }) {
  return <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:border-teal-300 hover:shadow-md motion-reduce:transform-none">
    <Link to={`/doctors/${doctor.doctorId}`} aria-label={`Xem hồ sơ bác sĩ ${doctor.fullName}`} className="relative grid h-36 place-items-center overflow-hidden bg-gradient-to-br from-teal-100 via-cyan-50 to-sky-100"><span aria-hidden="true" className="absolute -right-8 -top-10 size-40 rounded-full border-[20px] border-white/40" /><DoctorAvatar name={doctor.fullName} url={doctor.avatarUrl} className="relative size-24 border-4 border-white bg-white text-2xl shadow-sm" /></Link>
    <div className="flex flex-1 flex-col p-5"><p className="text-xs font-semibold text-teal-700">{doctor.specialtyName}</p><h3 className="mt-2 font-display text-base font-bold leading-6 text-slate-900"><Link to={`/doctors/${doctor.doctorId}`} className="hover:text-teal-800">{doctor.title ? `${doctor.title} ` : ''}{doctor.fullName}</Link></h3><div className="mt-auto pt-5"><div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-4"><span className="text-xs text-slate-500">Phí khám</span><strong className="text-sm text-slate-900">{formatCatalogPrice(doctor.consultationFee)}</strong></div><Link to={`/doctors/${doctor.doctorId}`} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-teal-50 px-3 py-2.5 text-sm font-bold text-teal-800 transition hover:bg-teal-700 hover:text-white">Xem hồ sơ <ArrowRight className="size-4" /></Link></div></div>
  </article>
}

export function ServicePreviewCard({ service }: { service: CatalogService }) {
  const name = service.name.toLocaleLowerCase('vi')
  const Icon = name.includes('xét nghiệm') ? FlaskConical : name.includes('siêu âm') || name.includes('chụp') ? ScanLine : Stethoscope
  return <article className="flex h-full items-start gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-teal-100 text-teal-800"><Icon className="size-6" /></span><div className="min-w-0 flex-1"><h3 className="text-sm font-bold leading-6 text-slate-900">{service.name}</h3><p className="mt-2 text-base font-bold text-teal-700">{formatCatalogPrice(service.price)}</p></div></article>
}
