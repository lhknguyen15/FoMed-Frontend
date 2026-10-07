import { displayError } from '../../../shared/api/user-messages'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, Search, Stethoscope } from 'lucide-react'
import { catalogApi } from '../../../features/catalogs/api/catalog-api'
import type { CatalogSpecialty, PublicDoctor } from '../../../features/catalogs/types/catalog'
import DoctorAvatar from '../../../features/doctors/components/DoctorAvatar'
import PublicHeader from '../components/PublicHeader'
import PublicFooter from '../components/PublicFooter'

const pageSize = 8
const fee = (value: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value)
const bookingPath = (doctorId: number) => `/login?returnUrl=${encodeURIComponent(`/booking?doctorId=${doctorId}`)}`

export default function DoctorListPage() {
  const [params, setParams] = useSearchParams()
  const searchTerm = params.get('search') ?? ''
  const specialtyValue = params.get('specialtyId') ?? ''
  const requestedPage = Math.max(1, Number(params.get('page') || 1))
  const [search, setSearch] = useState(searchTerm)
  const [doctors, setDoctors] = useState<PublicDoctor[]>([])
  const [specialties, setSpecialties] = useState<CatalogSpecialty[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const selectedSpecialty = specialties.find((item) => item.specialtyId === Number(specialtyValue))

  useEffect(() => setSearch(searchTerm), [searchTerm])

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    void Promise.all([
      catalogApi.doctors(specialtyValue ? Number(specialtyValue) : undefined, searchTerm),
      catalogApi.specialties(),
    ]).then(([doctorRows, specialtyRows]) => {
      if (active) { setDoctors(doctorRows); setSpecialties(specialtyRows) }
    }).catch((reason: unknown) => {
      if (active) setError(displayError(reason, 'Không thể tải danh sách bác sĩ.'))
    }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [searchTerm, specialtyValue])

  const pageCount = Math.max(1, Math.ceil(doctors.length / pageSize))
  const page = Math.min(requestedPage, pageCount)
  const visibleDoctors = useMemo(() => doctors.slice((page - 1) * pageSize, page * pageSize), [doctors, page])
  const updateFilters = (nextSearch: string, nextSpecialty: string) => {
    const next = new URLSearchParams()
    if (nextSearch.trim()) next.set('search', nextSearch.trim())
    if (nextSpecialty) next.set('specialtyId', nextSpecialty)
    setParams(next)
  }
  const submit = (event: FormEvent) => { event.preventDefault(); updateFilters(search, specialtyValue) }
  const setPage = (nextPage: number) => {
    const next = new URLSearchParams(params)
    if (nextPage > 1) next.set('page', String(nextPage))
    else next.delete('page')
    setParams(next)
  }

  return <div className="min-h-screen bg-[#f7f8fa]"><PublicHeader /><main className="mx-auto max-w-7xl px-4 py-6 sm:px-7 sm:py-9">
    <div className="mb-5"><Link to="/" className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-teal-700"><ArrowLeft className="size-3.5" /> Trang chủ</Link><p className="mt-4 text-xs font-bold text-teal-700">ĐẶT KHÁM BÁC SĨ</p><h1 className="mt-1 font-display text-2xl font-extrabold tracking-tight text-slate-900 sm:text-[1.75rem]">{selectedSpecialty ? `Bác sĩ ${selectedSpecialty.name}` : 'Tìm bác sĩ'}</h1></div>

    <form onSubmit={submit} className="mb-5 flex gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-sm"><label className="flex min-w-0 flex-1 items-center gap-2.5 px-2"><Search className="size-4 shrink-0 text-teal-700" /><span className="sr-only">Tìm bác sĩ</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm theo tên bác sĩ..." className="min-w-0 flex-1 text-sm outline-none placeholder:text-slate-400" /></label><button className="inline-flex h-10 shrink-0 items-center gap-2 rounded-lg bg-teal-700 px-4 text-sm font-bold text-white hover:bg-teal-800"><Search className="size-4" /> Tìm</button></form>

    <div className="grid items-start gap-5 lg:grid-cols-[240px_minmax(0,1fr)]">
      <aside className="hidden rounded-xl border border-slate-200 bg-white p-4 lg:block"><h2 className="text-sm font-extrabold text-slate-900">Lọc bác sĩ</h2><label className="mt-4 block"><span className="mb-2 block text-xs font-bold text-slate-600">Chuyên khoa</span><select value={specialtyValue} onChange={(event) => updateFilters(searchTerm, event.target.value)} className="input-base h-10 min-h-10 text-sm"><option value="">Tất cả chuyên khoa</option>{specialties.map((item) => <option key={item.specialtyId} value={item.specialtyId}>{item.name}</option>)}</select></label><div className="mt-5 border-t border-slate-100 pt-4"><Link to="/specialties" className="text-xs font-bold text-teal-700 hover:text-teal-900">Xem danh mục chuyên khoa <ArrowRight className="ml-1 inline size-3.5" /></Link></div></aside>
      <section className="min-w-0">
        <div className="mb-3 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-sm font-extrabold text-slate-900">Danh sách bác sĩ</h2><p className="mt-1 text-xs text-slate-500">{loading ? 'Đang tìm kiếm...' : `${doctors.length} kết quả`}{searchTerm ? ` cho “${searchTerm}”` : ''}</p></div><label className="flex items-center gap-2 text-xs text-slate-500 lg:hidden"><span className="shrink-0 font-semibold">Chuyên khoa</span><select value={specialtyValue} onChange={(event) => updateFilters(searchTerm, event.target.value)} className="input-base h-9 min-h-9 py-1 text-xs"><option value="">Tất cả</option>{specialties.map((item) => <option key={item.specialtyId} value={item.specialtyId}>{item.name}</option>)}</select></label></div>
        {loading ? <div className="grid min-h-56 place-items-center rounded-xl border border-slate-200 bg-white text-sm text-slate-500">Đang tải bác sĩ...</div> : error ? <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div> : visibleDoctors.length ? <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">{visibleDoctors.map((doctor) => <article key={doctor.doctorId} className="flex flex-col gap-4 border-b border-slate-100 p-4 last:border-b-0 sm:flex-row sm:items-center sm:px-5"><DoctorAvatar name={doctor.fullName} url={doctor.avatarUrl} className="size-16 text-base" /><div className="min-w-0 flex-1"><Link to={`/doctors/${doctor.doctorId}`} className="font-display text-sm font-extrabold text-slate-900 hover:text-teal-800">{doctor.title ? `${doctor.title} ` : ''}{doctor.fullName}</Link><p className="mt-1 text-xs font-semibold text-teal-700">{doctor.specialtyName}</p></div><div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-3 sm:w-48 sm:flex-col sm:items-end sm:border-0 sm:pt-0"><span className="text-xs text-slate-500">Phí khám <strong className="ml-1 text-slate-800">{fee(doctor.consultationFee)}</strong></span><div className="flex gap-2"><Link to={`/doctors/${doctor.doctorId}`} className="inline-flex h-9 items-center rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-700 hover:border-teal-300 hover:text-teal-800">Xem hồ sơ</Link><Link to={bookingPath(doctor.doctorId)} className="inline-flex h-9 items-center rounded-lg bg-teal-700 px-3 text-xs font-bold text-white hover:bg-teal-800">Đặt khám</Link></div></div></article>)}</div> : <div className="rounded-xl border border-slate-200 bg-white px-5 py-12 text-center"><Stethoscope className="mx-auto size-8 text-slate-300" /><h3 className="mt-3 text-sm font-bold text-slate-800">Không tìm thấy bác sĩ</h3><p className="mt-1 text-xs text-slate-500">Thử từ khóa khác hoặc chọn tất cả chuyên khoa.</p></div>}
        {!loading && !error && doctors.length > pageSize && <nav aria-label="Phân trang bác sĩ" className="mt-4 flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3"><span className="text-xs text-slate-500">Trang {page} / {pageCount}</span><div className="flex items-center gap-1"><button disabled={page <= 1} onClick={() => setPage(page - 1)} className="grid size-9 place-items-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40" aria-label="Trang trước"><ChevronLeft className="size-4" /></button>{Array.from({ length: pageCount }, (_, index) => index + 1).map((item) => <button key={item} onClick={() => setPage(item)} aria-current={item === page ? 'page' : undefined} className={`grid size-9 place-items-center rounded-lg text-xs font-bold ${item === page ? 'bg-teal-700 text-white' : 'border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>{item}</button>)}<button disabled={page >= pageCount} onClick={() => setPage(page + 1)} className="grid size-9 place-items-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40" aria-label="Trang sau"><ChevronRight className="size-4" /></button></div></nav>}
      </section>
    </div>
  </main><PublicFooter /></div>
}
