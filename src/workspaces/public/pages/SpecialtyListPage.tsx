import { displayError } from '../../../shared/api/user-messages'
import { useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, HeartPulse, Search } from 'lucide-react'
import { catalogApi } from '../../../features/catalogs/api/catalog-api'
import type { CatalogSpecialty, PublicDoctor } from '../../../features/catalogs/types/catalog'
import PublicHeader from '../components/PublicHeader'
import PublicFooter from '../components/PublicFooter'

const appointmentPath = (doctorId?: number) => `/login?returnUrl=${encodeURIComponent(doctorId ? `/booking?doctorId=${doctorId}` : '/booking')}`
const initials = (name: string) => name.trim().split(/\s+/).slice(-2).map((part) => part[0]).join('').toUpperCase()
const fee = (value: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value)

export default function SpecialtyListPage() {
  const { specialtyId } = useParams()
  const [specialties, setSpecialties] = useState<CatalogSpecialty[]>([])
  const [doctors, setDoctors] = useState<PublicDoctor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const selectedId = Number(specialtyId)
  const selected = specialties.find((item) => item.specialtyId === selectedId)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    const requests = specialtyId
      ? Promise.all([catalogApi.specialties(), catalogApi.doctors(selectedId)])
      : catalogApi.specialties().then((items) => [items, [] as PublicDoctor[]] as const)
    void requests.then(([specialtyData, doctorData]) => {
      if (!active) return
      setSpecialties(specialtyData)
      setDoctors(doctorData)
    }).catch((reason: unknown) => {
      if (active) setError(displayError(reason, 'Không thể tải danh mục chuyên khoa.'))
    }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [selectedId, specialtyId])

  if (specialtyId && Number.isInteger(selectedId) && selectedId > 0) return <Navigate to={`/doctors?specialtyId=${selectedId}`} replace />

  const content = specialtyId ? <>
    <Link to="/specialties" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-teal-800"><ArrowLeft className="size-4" /> Tất cả chuyên khoa</Link>
    <div className="mt-5 flex items-start gap-4"><span className="grid size-12 shrink-0 place-items-center rounded-xl bg-teal-50 text-teal-700"><HeartPulse className="size-5" /></span><div><p className="text-xs font-extrabold tracking-[.15em] text-teal-700">CHUYÊN KHOA</p><h1 className="mt-1 font-display text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">{selected?.name ?? (loading ? 'Đang tải chuyên khoa...' : 'Không tìm thấy chuyên khoa')}</h1><p className="mt-2 text-sm text-slate-600">Danh sách bác sĩ thuộc chuyên khoa này.</p></div></div>
    {selected?.description && <p className="mt-5 max-w-3xl text-sm leading-6 text-slate-600">{selected.description}</p>}
    {error ? <LoadError message={error} /> : loading ? <Loading /> : doctors.length ? <div className="mt-7 grid gap-3 sm:grid-cols-2">{doctors.map((doctor, index) => <DoctorRow key={doctor.doctorId} doctor={doctor} index={index} />)}</div> : <Empty message="Chưa có bác sĩ được công khai trong chuyên khoa này." />}
  </> : <>
    <p className="text-xs font-extrabold tracking-[.15em] text-teal-700">DANH MỤC FO MED</p><h1 className="mt-1 font-display text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">Chuyên khoa</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Chọn chuyên khoa để xem danh sách bác sĩ tương ứng.</p>
    {error ? <LoadError message={error} /> : loading ? <Loading /> : <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{specialties.map((specialty) => <Link key={specialty.specialtyId} to={`/doctors?specialtyId=${specialty.specialtyId}`} className="group flex min-h-24 items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 transition hover:border-teal-300 hover:shadow-sm"><span className="grid size-10 shrink-0 place-items-center rounded-lg bg-teal-50 text-teal-700"><HeartPulse className="size-5" /></span><span className="min-w-0 flex-1"><strong className="block text-sm font-bold text-slate-800 group-hover:text-teal-800">{specialty.name}</strong><span className="mt-1 block text-xs text-slate-500">{specialty.description || 'Xem bác sĩ trong chuyên khoa'}</span></span><ArrowRight className="size-4 shrink-0 text-slate-400 group-hover:text-teal-700" /></Link>)}</div>}
  </>

  return <div className="min-h-screen bg-[#f8faf9]"><PublicHeader /><main className="mx-auto min-h-[60vh] max-w-7xl px-5 py-9 sm:px-8 sm:py-12">{content}</main><PublicFooter /></div>
}

function DoctorRow({ doctor, index }: { doctor: PublicDoctor; index: number }) {
  const tones = ['bg-teal-50 text-teal-800', 'bg-sky-50 text-sky-800', 'bg-violet-50 text-violet-800', 'bg-amber-50 text-amber-800']
  return <article className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center"><div className={`grid size-12 shrink-0 place-items-center rounded-xl font-display font-extrabold ${tones[index % tones.length]}`}>{initials(doctor.fullName)}</div><div className="min-w-0 flex-1"><Link to={`/doctors/${doctor.doctorId}`} className="font-bold text-slate-900 hover:text-teal-800">{doctor.title ? `${doctor.title} ` : ''}{doctor.fullName}</Link><p className="mt-1 text-sm text-slate-500">{doctor.specialtyName}</p><p className="mt-1 text-sm font-semibold text-teal-800">Phí khám {fee(doctor.consultationFee)}</p></div><div className="flex shrink-0 gap-2"><Link to={`/doctors/${doctor.doctorId}`} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-700 hover:border-teal-300 hover:text-teal-800">Thông tin <ArrowRight className="size-3.5" /></Link><Link to={appointmentPath(doctor.doctorId)} className="inline-flex h-9 items-center rounded-lg bg-teal-700 px-3 text-xs font-bold text-white hover:bg-teal-800">Đặt lịch</Link></div></article>
}

function Loading() { return <div className="mt-7 grid min-h-40 place-items-center rounded-xl border border-slate-200 bg-white text-sm text-slate-500"><span className="flex items-center gap-3"><span className="size-5 animate-spin rounded-full border-2 border-teal-100 border-t-teal-700" /> Đang tải dữ liệu...</span></div> }
function Empty({ message }: { message: string }) { return <div className="mt-7 rounded-xl border border-dashed border-slate-300 bg-white px-5 py-10 text-center text-sm text-slate-500">{message}</div> }
function LoadError({ message }: { message: string }) { return <div className="mt-7 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"><Search className="mr-2 inline size-4" />{message}</div> }
