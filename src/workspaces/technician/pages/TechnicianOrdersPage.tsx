import { displayError } from '../../../shared/api/user-messages'
import { notify } from '../../../shared/notifications/notify'
import { ClipboardList, FlaskConical, RefreshCw, Save, XCircle } from 'lucide-react'
import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import AppShell from '../../../components/AppShell'
import { Badge, Button, Card, EmptyState, PageTitle } from '../../../components/ui'
import { clinicalApi } from '../../../features/clinical/api/clinical-api'
import type { ServiceOrder } from '../../../features/clinical/types/clinical'
import { useApiQuery } from '../../../shared/hooks/useApiQuery'

type ResultDraft = { resultSummary: string; conclusion: string; referenceRange: string }

function ResultError({ text }: { text: string }) {
  return <p role="alert" className="mb-5 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-700"><XCircle className="size-5 shrink-0" />{text}</p>
}

export default function TechnicianOrdersPage() {
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<number | null>(null)
  const [drafts, setDrafts] = useState<Record<number, ResultDraft>>({})
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<{ type: 'error'; text: string } | null>(null)
  const mutationPending = useRef(false)
  const orders = useApiQuery(`technician-orders-${page}`, () => clinicalApi.pendingLabOrders(page))
  const rows = orders.data ?? []
  const hasNext = rows.length === 20
  const editorVisible = selected !== null && !orders.loading && !orders.error && rows.some(order => order.id === selected)

  const draft = (id: number): ResultDraft => drafts[id] ?? { resultSummary: '', conclusion: '', referenceRange: '' }
  const update = (id: number, key: keyof ResultDraft, value: string) => setDrafts((current) => ({ ...current, [id]: { ...draft(id), [key]: value } }))

  const submit = async (order: ServiceOrder) => {
    if (mutationPending.current || busy || orders.loading || orders.error || selected !== order.id || !rows.some(item => item.id === order.id)) return
    const value = draft(order.id)
    if (!value.resultSummary.trim()) {
      setNotice({ type: 'error', text: 'Vui lòng nhập kết quả xét nghiệm.' })
      return
    }
    mutationPending.current = true
    setBusy(true)
    setNotice(null)
    try {
      await clinicalApi.saveLabResult(order.id, { resultSummary: value.resultSummary.trim(), conclusion: value.conclusion.trim() || undefined, referenceRange: value.referenceRange.trim() || undefined })
      setSelected(null)
      notify.success('Đã lưu kết quả và cập nhật trạng thái chỉ định.')
      orders.refresh()
    } catch (error) {
      setNotice({ type: 'error', text: displayError(error, 'Không thể lưu kết quả.') })
    } finally {
      mutationPending.current = false
      setBusy(false)
    }
  }

  return <AppShell>
    <PageTitle eyebrow="Cận lâm sàng" title="Chỉ định chờ thực hiện" description="Nhập kết quả và trả về bệnh án của bác sĩ." action={<div className="flex flex-wrap gap-2"><Link to="/technician/results" className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:border-teal-300 hover:text-teal-800"><ClipboardList className="size-4" /> Lịch sử kết quả</Link><Button variant="secondary" onClick={orders.refresh}><RefreshCw className="size-4" /> Làm mới</Button></div>} />
    {notice && !editorVisible && <ResultError text={notice.text} />}
    <Card className="overflow-hidden">{orders.loading ? <div className="grid min-h-72 place-items-center"><span className="size-9 animate-spin rounded-full border-4 border-teal-100 border-t-teal-700" /></div> : orders.error ? <div className="p-8 text-center"><XCircle className="mx-auto size-10 text-rose-500" /><p className="mt-3 text-sm text-slate-500">{orders.error}</p><Button className="mt-5" onClick={orders.refresh}>Thử lại</Button></div> : !rows.length ? <EmptyState icon={<FlaskConical className="size-6" />} title="Không còn chỉ định chờ" body="Các chỉ định mới từ bác sĩ sẽ xuất hiện tại đây." /> : <>
      <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-display text-lg font-bold text-slate-900">Danh sách chỉ định</h2><p className="mt-1 text-sm text-slate-500">Trang {page} · tối đa 20 chỉ định</p></div><div className="flex items-center gap-3"><Badge tone="warning">{rows.length} đang chờ</Badge></div></div>
      <div className="overflow-x-auto"><table className="data-table"><thead><tr><th>Dịch vụ</th><th>Bệnh án</th><th>SL</th><th>Đơn giá lúc chỉ định</th><th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody>{rows.map((order) => <tr key={order.id}><td><span className="flex items-center gap-2"><FlaskConical className="size-4 text-sky-700" /><strong>{order.serviceName}</strong></span></td><td>#{order.medicalRecordId}</td><td>{order.quantity}</td><td>{order.unitPriceSnapshot.toLocaleString('vi-VN')} đ</td><td><Badge tone="warning">Đang chờ</Badge></td><td><Button className="h-8 px-3 text-xs" disabled={busy} onClick={() => setSelected((value) => value === order.id ? null : order.id)}><ClipboardList className="size-4" /> {selected === order.id ? 'Đóng' : 'Nhập kết quả'}</Button></td></tr>)}</tbody></table></div>
      {editorVisible && <div className="border-t border-slate-100 bg-teal-50/40 p-5">{(() => {
        const order = rows.find(item => item.id === selected)!
        return <div>
          <div className="mb-4 flex items-center gap-2"><ClipboardList className="size-5 text-teal-700" /><div><h3 className="font-display font-bold text-slate-900">Nhập kết quả · {order.serviceName}</h3><p className="text-sm text-slate-500">Bệnh án #{order.medicalRecordId} · sau khi lưu, trạng thái sẽ chuyển sang Đã có kết quả.</p></div></div>
          <div className="grid gap-3 md:grid-cols-3">
            <label className="md:col-span-3"><span className="field-label">Kết quả <span className="text-rose-500">*</span></span><textarea disabled={busy} value={draft(order.id).resultSummary} onChange={(event) => update(order.id, 'resultSummary', event.target.value)} rows={3} className="input-base resize-none" placeholder="Nhập kết quả đo/xét nghiệm..." /></label>
            <label><span className="field-label">Kết luận</span><textarea disabled={busy} value={draft(order.id).conclusion} onChange={(event) => update(order.id, 'conclusion', event.target.value)} rows={2} className="input-base resize-none" placeholder="Nhận định chuyên môn..." /></label>
            <label className="md:col-span-2"><span className="field-label">Khoảng tham chiếu</span><textarea disabled={busy} value={draft(order.id).referenceRange} onChange={(event) => update(order.id, 'referenceRange', event.target.value)} rows={2} className="input-base resize-none" placeholder="Ví dụ: 12–16 g/dL" /></label>
          </div>
          <div className="mt-4">{notice && <ResultError text={notice.text} />}<div className="flex justify-end"><Button disabled={busy} onClick={() => void submit(order)}><Save className="size-4" /> {busy ? 'Đang lưu...' : 'Lưu kết quả'}</Button></div></div>
        </div>
      })()}</div>}
      <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4 text-sm text-slate-500"><span>Hiển thị {rows.length} chỉ định</span><span className="flex items-center gap-2"><Button variant="secondary" className="h-8 px-3 text-xs" disabled={page <= 1} onClick={() => { setPage((value) => value - 1); setSelected(null) }}>Trước</Button><span>Trang {page}{hasNext ? '' : ' · cuối'}</span><Button variant="secondary" className="h-8 px-3 text-xs" disabled={!hasNext} onClick={() => { setPage((value) => value + 1); setSelected(null) }}>Sau</Button></span></div>
    </>}</Card>
  </AppShell>
}
