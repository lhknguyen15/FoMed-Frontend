import { displayError } from '../../../shared/api/user-messages'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowLeft, ChevronLeft, ChevronRight, Search, Stethoscope } from 'lucide-react'
import { catalogApi } from '../../../features/catalogs/api/catalog-api'
import type { CatalogService } from '../../../features/catalogs/types/catalog'
import PublicHeader from '../components/PublicHeader'
import PublicFooter from '../components/PublicFooter'
import { ServicePreviewCard } from '../components/PublicCatalogCards'

export default function ServiceListPage() {
  const [params, setParams] = useSearchParams()
  const parsedPage = Number(params.get('page') ?? 1)
  const page = Number.isSafeInteger(parsedPage) && parsedPage >= 1 && parsedPage < 1000000 ? parsedPage : 1
  const [services, setServices] = useState<CatalogService[]>([])
  const [hasNext, setHasNext] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('')

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    setSearch('')
    setFilter('')
    // API chưa trả total/hasNext: đọc trước trang kế để tránh điều hướng đến trang rỗng.
    void Promise.all([catalogApi.services(page), catalogApi.services(page + 1)])
      .then(([rows, nextRows]) => { if (active) { setServices(rows); setHasNext(nextRows.length > 0) } })
      .catch((reason: unknown) => { if (active) setError(displayError(reason, 'Không thể tải danh sách dịch vụ.')) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [page, retry])

  const visible = useMemo(() => {
    const keyword = filter.toLocaleLowerCase('vi')
    return services.filter((item) => item.name.toLocaleLowerCase('vi').includes(keyword))
  }, [services, filter])
  const changePage = (next: number) => {
    const updated = new URLSearchParams(params)
    if (next === 1) updated.delete('page')
    else updated.set('page', String(next))
    setParams(updated)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const submit = (event: FormEvent) => { event.preventDefault(); setFilter(search.trim()) }

  return <div className="min-h-screen bg-[#eef5fa]">
    <PublicHeader />
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <Link to="/" className="inline-flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-teal-700"><ArrowLeft className="size-3.5" /> Trang chủ</Link>
      <div className="mt-5 max-w-2xl"><p className="text-xs font-bold uppercase tracking-[.15em] text-teal-700">DỊCH VỤ & BẢNG GIÁ</p><h1 className="mt-2 font-display text-2xl font-bold text-slate-950 sm:text-3xl">Dịch vụ tại FoMed</h1><p className="mt-3 text-sm leading-7 text-slate-600">Tham khảo tên dịch vụ và mức giá trong danh mục. Chỉ định dịch vụ cụ thể được thực hiện bởi nhân viên y tế trong quá trình thăm khám.</p></div>
      <form onSubmit={submit} className="mt-6 flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-2 sm:flex-row"><label className="flex min-w-0 flex-1 items-center gap-3 px-3 py-3"><Search className="size-5 shrink-0 text-teal-700" /><span className="sr-only">Tìm tên dịch vụ trong trang hiện tại</span><input type="search" autoComplete="off" name="serviceSearch" disabled={loading || Boolean(error)} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm tên dịch vụ trong trang này..." className="min-w-0 flex-1 bg-transparent text-sm outline-none" /></label><button disabled={loading || Boolean(error)} type="submit" className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-teal-700 px-5 text-sm font-bold text-white hover:bg-teal-800 disabled:opacity-50"><Search className="size-4" /> Tìm kiếm</button></form>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500"><p>{loading ? 'Đang tải danh mục...' : error ? 'Chưa tải được danh mục' : `Trang ${page} · ${visible.length}/${services.length} dịch vụ`}</p>{filter && <button onClick={() => { setFilter(''); setSearch('') }} className="font-semibold text-teal-700 hover:text-teal-900">Xóa tìm kiếm</button>}</div>
      {loading ? <div role="status" className="mt-5 grid min-h-56 place-items-center rounded-2xl border border-slate-200 bg-white text-sm text-slate-500">Đang tải dịch vụ...</div> : error ? <div role="alert" className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700"><p>{error}</p><button onClick={() => setRetry((value) => value + 1)} className="mt-4 rounded-xl border border-rose-200 bg-white px-4 py-2 font-semibold">Tải lại</button></div> : visible.length > 0 ? <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{visible.map((service) => <ServicePreviewCard key={service.id} service={service} />)}</div> : <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-10 text-center"><Stethoscope className="mx-auto size-8 text-teal-300" /><h2 className="mt-4 text-base font-bold text-slate-800">{filter ? 'Không tìm thấy dịch vụ trong trang này' : 'Trang này chưa có dịch vụ'}</h2><p className="mt-2 text-sm text-slate-500">{filter ? 'Thử từ khóa khác hoặc chuyển trang để xem thêm danh mục.' : 'Bạn có thể quay lại trang đầu của danh mục.'}</p>{page > 1 && <button onClick={() => changePage(1)} className="mt-4 text-sm font-bold text-teal-700">Về trang đầu</button>}</div>}
      {!loading && !error && <nav aria-label="Phân trang dịch vụ" className="mt-7 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">Tối đa 20 dịch vụ mỗi trang. Tìm kiếm áp dụng trong trang hiện tại.</p><div className="flex items-center gap-2"><button aria-label="Trang trước" disabled={page <= 1} onClick={() => changePage(page - 1)} className="inline-flex h-10 items-center gap-1 rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"><ChevronLeft className="size-4 shrink-0" /><span className="hidden sm:inline">Trang trước</span><span className="sm:hidden">Trước</span></button><span aria-current="page" className="px-2 text-sm font-bold text-teal-800">{page}</span><button aria-label="Trang sau" disabled={!hasNext} onClick={() => changePage(page + 1)} className="inline-flex h-10 items-center gap-1 rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"><span className="hidden sm:inline">Trang sau</span><span className="sm:hidden">Sau</span><ChevronRight className="size-4 shrink-0" /></button></div></nav>}
    </main>
    <PublicFooter />
  </div>
}
