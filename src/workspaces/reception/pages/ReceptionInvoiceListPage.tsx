import { displayError } from '../../../shared/api/user-messages'
import { AlertCircle, ArrowRight, CheckCircle2, ReceiptText, RefreshCw, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import AppShell from '../../../components/AppShell'
import { Badge, Button, Card, PageTitle } from '../../../components/ui'
import { invoiceApi } from '../../../features/billing/api/billing-api'
import InvoiceFilterForm from '../../../features/billing/components/InvoiceFilterForm'
import type { InvoiceCandidate, InvoiceFilters, InvoiceStatusFilter } from '../../../features/billing/types/billing'
import { useApiQuery } from '../../../shared/hooks/useApiQuery'
import { formatDateTime } from '../../../shared/utils/format-date'
import { invoiceDetailPath } from '../../../features/billing/utils/invoice-navigation'

const money = (value: number) => `${value.toLocaleString('vi-VN')} đ`

function CreateInvoiceDialog({ candidate, onClose, onCreated }: { candidate: InvoiceCandidate; onClose: () => void; onCreated: (id: number) => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const pending = useRef(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => {
    const modal = dialog.current!
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    modal.showModal()
    return () => { modal.close(); document.body.style.overflow = previousOverflow; previousFocus?.focus() }
  }, [])
  const create = async () => {
    if (pending.current) return
    pending.current = true
    setSubmitting(true); setError('')
    try { const invoice = await invoiceApi.create(candidate.medicalRecordId); onCreated(invoice.id) }
    catch (reason) { setError(displayError(reason, 'Không thể lập hóa đơn.')) }
    finally { pending.current = false; setSubmitting(false) }
  }
  return <dialog ref={dialog} aria-labelledby="create-invoice-title" onCancel={event => { event.preventDefault(); if (!pending.current) onClose() }} className="m-auto max-h-[calc(100dvh_-_2rem)] w-[calc(100%_-_2rem)] max-w-lg overflow-y-auto rounded-3xl border-0 bg-white p-6 shadow-2xl backdrop:bg-slate-950/40 sm:p-8">
    <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-wider text-teal-700">Thu ngân</p><h2 id="create-invoice-title" className="mt-1 font-display text-xl font-bold">Lập hóa đơn</h2></div><button type="button" aria-label="Đóng lập hóa đơn" disabled={submitting} onClick={onClose} className="grid size-9 shrink-0 place-items-center rounded-xl text-slate-500 hover:bg-slate-100"><X className="size-5" /></button></div>
    <div className="my-5 space-y-3 rounded-2xl bg-slate-50 p-4 text-sm"><p className="break-words font-semibold">{candidate.patientName} · Hồ sơ #{candidate.medicalRecordId}</p><p className="text-slate-500">{formatDateTime(candidate.appointmentStartTime)}</p><p className="flex justify-between gap-3"><span>Phí khám</span><strong>{money(candidate.consultationFee)}</strong></p><p className="flex justify-between gap-3"><span>Dịch vụ & thuốc</span><strong>{money(candidate.serviceAndMedicineAmount)}</strong></p><p className="flex justify-between gap-3 border-t border-slate-200 pt-3"><span>Tổng dự kiến</span><strong className="text-teal-700">{money(candidate.estimatedTotalAmount)}</strong></p></div>
    <p className="text-sm leading-6 text-slate-600">Chỉ lập hóa đơn khi bệnh án đã chốt. Hệ thống tính lại theo giá đã ghi nhận, chỉ thu phí chỉ định hoàn thành và không tính chỉ định đã hủy.</p>
    {error && <p role="alert" className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
    <div className="mt-6 flex flex-wrap justify-end gap-3"><Button variant="secondary" disabled={submitting} onClick={onClose}>Để sau</Button><Button disabled={submitting} onClick={() => void create()}>{submitting ? 'Đang lập hóa đơn...' : 'Xác nhận lập hóa đơn'}</Button></div>
  </dialog>
}

export default function ReceptionInvoiceListPage() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const returnTo = `/reception/cashier${params.size ? `?${params}` : ''}`
  const tab = params.get('tab') === 'eligible' ? 'eligible' : 'issued'
  const requestedPage = Number(params.get('page') ?? 1)
  const page = Number.isSafeInteger(requestedPage) && requestedPage >= 1 && requestedPage <= 100000 ? requestedPage : 1
  const status = params.get('status') ?? 'all'
  const filters: InvoiceFilters = { keyword: params.get('keyword') ?? '', status: (['all', 'outstanding', 'unpaid', 'partial', 'paid', 'cancelled'].includes(status) ? status : 'all') as InvoiceStatusFilter, fromDate: params.get('fromDate') ?? '', toDate: params.get('toDate') ?? '' }
  const filterKey = JSON.stringify(filters)
  const requestKey = `${tab}-${page}-${filterKey}`
  const [candidate, setCandidate] = useState<InvoiceCandidate | null>(null)
  const invoices = useApiQuery(`reception-invoices-${requestKey}`, async () => ({ key: requestKey, result: tab === 'issued' ? await invoiceApi.search(filters, page) : null }))
  const candidates = useApiQuery(`invoice-candidates-${tab}-${page}`, () => tab === 'eligible' ? invoiceApi.eligible(page) : Promise.resolve([]))
  const issued = invoices.data?.key === requestKey ? invoices.data.result : null
  const query = tab === 'issued' ? invoices : candidates
  const loading = query.loading || (tab === 'issued' && !query.error && !issued)
  const count = tab === 'issued' ? issued?.items.length ?? 0 : candidates.data?.length ?? 0
  const updateParams = (changes: Record<string, string>) => { const next = new URLSearchParams(params); Object.entries(changes).forEach(([key, value]) => { if (value) next.set(key, value); else next.delete(key) }); setParams(next) }
  const changeTab = (value: typeof tab) => updateParams({ tab: value, page: '1' })
  const applyFilters = (value: InvoiceFilters) => updateParams({ ...value, page: '1' })
  const nextDisabled = tab === 'issued' ? !issued || page * issued.pageSize >= issued.totalCount : count < 20
  return <AppShell>
    <PageTitle eyebrow="Bàn tiếp đón · Thu ngân" title="Hóa đơn cần xử lý" description="Lập hóa đơn từ lượt khám đã hoàn tất, sau đó ghi nhận thanh toán." action={<Button variant="secondary" onClick={query.refresh}><RefreshCw className="size-4" /> Làm mới</Button>} />
    <div className="mb-5 flex flex-wrap gap-2" role="group" aria-label="Danh sách thu ngân"><Button aria-pressed={tab === 'issued'} variant={tab === 'issued' ? 'primary' : 'secondary'} onClick={() => changeTab('issued')}>Hóa đơn đã lập</Button><Button aria-pressed={tab === 'eligible'} variant={tab === 'eligible' ? 'primary' : 'secondary'} onClick={() => changeTab('eligible')}>Chờ lập hóa đơn</Button></div>
    {tab === 'issued' && <InvoiceFilterForm key={filterKey} initialValue={filters} onApply={applyFilters} />}
    {loading ? <Card className="grid min-h-64 place-items-center"><span className="size-9 animate-spin rounded-full border-4 border-teal-100 border-t-teal-700" /></Card> : query.error ? <Card className="p-8 text-center"><AlertCircle className="mx-auto size-10 text-rose-500" /><p role="alert" className="mt-3 text-sm text-rose-700">{query.error}</p><Button className="mt-5" onClick={query.refresh}>Thử lại</Button></Card> : <Card className="overflow-hidden">
      {!count ? <div className="p-10 text-center"><CheckCircle2 className="mx-auto size-10 text-emerald-500" /><h2 className="mt-3 font-display text-lg font-bold">{tab === 'issued' ? 'Không có hóa đơn phù hợp' : 'Không có lượt khám chờ lập hóa đơn'}</h2><p className="mt-1 text-sm text-slate-500">{tab === 'issued' ? 'Thử thay đổi hoặc xóa bộ lọc để xem các hóa đơn khác.' : 'Lượt khám cần hoàn tất và không còn chỉ định đang chờ thực hiện.'}</p></div> : <div className="overflow-x-auto"><table className="data-table"><thead>{tab === 'issued' ? <tr><th>Hóa đơn</th><th>Bệnh nhân</th><th>Ngày lập</th><th>Tổng tiền</th><th>Đã thu</th><th>Trạng thái</th><th>Thao tác</th></tr> : <tr><th>Bệnh nhân</th><th>Lượt khám</th><th>Phí khám</th><th>Dịch vụ & thuốc</th><th>Tổng dự kiến</th><th>Thao tác</th></tr>}</thead><tbody>
        {tab === 'issued' ? issued?.items.map(invoice => <tr key={invoice.id}><td><strong>{invoice.invoiceNo}</strong><small className="mt-1 block text-slate-500">Hồ sơ #{invoice.medicalRecordId ?? '—'}</small></td><td><strong>{invoice.patientName}</strong><small className="mt-1 block text-slate-500">{invoice.patientCode || `#${invoice.patientId}`}</small></td><td>{new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date(invoice.createdAt))}</td><td>{money(invoice.totalAmount)}</td><td>{money(invoice.paidAmount)}</td><td><Badge tone={invoice.status === 1 ? 'success' : invoice.status === 2 ? 'danger' : invoice.paidAmount > 0 ? 'warning' : 'info'}>{invoice.status === 1 ? 'Đã thanh toán' : invoice.status === 2 ? 'Đã hủy' : invoice.paidAmount > 0 ? 'Thanh toán một phần' : 'Chưa thanh toán'}</Badge></td><td><Button variant="secondary" className="h-8 px-3 text-xs" onClick={() => navigate(invoiceDetailPath(invoice.id, returnTo))}><ReceiptText className="size-4" /> Xem hóa đơn <ArrowRight className="size-4" /></Button></td></tr>) : candidates.data?.map(item => <tr key={item.medicalRecordId}><td><strong>{item.patientName}</strong><small className="mt-1 block text-slate-500">Mã BN #{item.patientId}</small></td><td><strong>Hồ sơ #{item.medicalRecordId}</strong><small className="mt-1 block text-slate-500">{formatDateTime(item.appointmentStartTime)}</small></td><td>{money(item.consultationFee)}</td><td>{money(item.serviceAndMedicineAmount)}</td><td className="font-semibold text-teal-700">{money(item.estimatedTotalAmount)}</td><td><Button className="h-8 px-3 text-xs" onClick={() => setCandidate(item)}><ReceiptText className="size-4" /> Lập hóa đơn</Button></td></tr>)}
      </tbody></table></div>}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 p-4"><span className="text-xs font-semibold text-slate-500">Trang {page} · {count} kết quả{tab === 'issued' && ` / ${issued?.totalCount ?? 0} hóa đơn phù hợp`}</span><div className="flex gap-2"><Button variant="secondary" disabled={page === 1} onClick={() => updateParams({ page: String(Math.max(1, page - 1)) })}>Trước</Button><Button variant="secondary" disabled={nextDisabled || page >= 100000} onClick={() => updateParams({ page: String(page + 1) })}>Sau</Button></div></div>
    </Card>}
    {candidate && <CreateInvoiceDialog candidate={candidate} onClose={() => { setCandidate(null); candidates.refresh() }} onCreated={id => navigate(invoiceDetailPath(id, returnTo), { state: { invoiceCreated: true } })} />}
  </AppShell>
}
