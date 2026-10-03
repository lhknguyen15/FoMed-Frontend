import { ArrowLeft, CheckCircle2, FlaskConical, Info, Paperclip, RefreshCw, X, XCircle } from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import AppShell from '../../../components/AppShell'
import { Badge, Button, Card, EmptyState, PageTitle } from '../../../components/ui'
import { clinicalApi } from '../../../features/clinical/api/clinical-api'
import type { ServiceOrder } from '../../../features/clinical/types/clinical'
import { useApiQuery } from '../../../shared/hooks/useApiQuery'

const statusLabel: Record<number, { label: string; tone: 'warning' | 'success' | 'danger' | 'neutral' }> = {
  0: { label: 'Ordered · Chờ thực hiện', tone: 'warning' },
  1: { label: 'Completed · Đã có kết quả', tone: 'success' },
  2: { label: 'Canceled · Đã hủy', tone: 'danger' },
}

function ActionCell({ order, editable, busy, onCancel }: { order: ServiceOrder; editable: boolean; busy: boolean; onCancel: (id: number) => void }) {
  if (order.status === 0 && editable) {
    return <Button variant="danger" className="h-9 px-3 text-xs" disabled={busy} onClick={() => onCancel(order.id)}><XCircle className="size-4" /> Hủy chỉ định</Button>
  }

  if (order.status === 1) return <span className="text-xs font-semibold text-slate-500">Đã thực hiện · tính phí</span>
  if (order.status === 2) return <span className="text-xs font-semibold text-slate-400">Đã hủy · không tính phí</span>
  return <span className="text-xs font-semibold text-slate-400">Bệnh án đã chốt</span>
}

export default function DoctorServicesPage() {
  const { recordId } = useParams()
  const id = Number(recordId)
  const navigate = useNavigate()
  const [serviceId, setServiceId] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [busy, setBusy] = useState(false)
  const [cancelingId, setCancelingId] = useState<number | null>(null)
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const record = useApiQuery(`doctor-services-record-${id}`, () => clinicalApi.record(id))
  const orders = useApiQuery(`doctor-services-orders-${id}`, () => clinicalApi.serviceOrders(id))
  const catalog = useApiQuery('doctor-services-catalog', () => clinicalApi.servicesCatalog())
  const editable = Boolean(record.data && !record.data.isFinalized)

  const add = async () => {
    if (!serviceId) return
    setBusy(true)
    setNotice(null)
    try {
      await clinicalApi.orderService(id, { serviceId: Number(serviceId), quantity: Number(quantity) || 1 })
      setNotice({ type: 'success', text: 'Đã thêm chỉ định dịch vụ. Đơn giá đã được chụp tại thời điểm chỉ định.' })
      setServiceId('')
      orders.refresh()
    } catch (error) {
      setNotice({ type: 'error', text: error instanceof Error ? error.message : 'Không thể thêm chỉ định.' })
    } finally {
      setBusy(false)
    }
  }

  const cancel = async (orderId: number) => {
    setBusy(true)
    setNotice(null)
    try {
      await clinicalApi.cancelOrder(orderId)
      setCancelingId(null)
      setNotice({ type: 'success', text: 'Đã hủy chỉ định. Chỉ định đã hủy sẽ không được đưa vào hóa đơn.' })
      orders.refresh()
    } catch (error) {
      setNotice({ type: 'error', text: error instanceof Error ? error.message : 'Không thể hủy chỉ định.' })
    } finally {
      setBusy(false)
    }
  }

  return <AppShell>
    <PageTitle eyebrow="Khám bệnh" title="Chỉ định & kết quả" description={`Bệnh án #${id} · chỉ định cận lâm sàng trong lượt khám.`} action={<Button variant="secondary" onClick={() => navigate(`/doctor/exam/${id}`)}><ArrowLeft className="size-4" /> Về bệnh án</Button>} />
    {notice && <p role={notice.type === 'error' ? 'alert' : 'status'} className={`mb-5 flex items-center gap-2 rounded-xl border p-3 text-sm font-semibold ${notice.type === 'error' ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>{notice.type === 'error' ? <XCircle className="size-5" /> : <CheckCircle2 className="size-5" />}{notice.text}</p>}
    {!editable && record.data?.isFinalized && <p className="mb-5 rounded-xl border border-sky-200 bg-sky-50 p-3 text-sm font-semibold text-sky-700">Bệnh án đã chốt, chỉ có thể xem lại chỉ định và kết quả. Chỉ định Ordered lúc này không còn được hủy.</p>}

    <Card className="mb-5 p-5">
      <div className="mb-4 flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-sky-50 text-sky-700"><FlaskConical className="size-5" /></span><div><h2 className="font-display text-lg font-bold text-slate-900">Thêm chỉ định</h2><p className="text-sm text-slate-500">Mỗi chỉ định lưu <strong>unit_price_snapshot</strong>; lượt khám chỉ được hoàn tất khi không còn chỉ định Ordered.</p></div></div>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end"><label className="min-w-0 flex-1"><span className="field-label">Dịch vụ</span><select disabled={!editable || busy || catalog.loading} value={serviceId} onChange={(event) => setServiceId(event.target.value)} className="input-base"><option value="">Chọn dịch vụ cận lâm sàng</option>{catalog.data?.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.price.toLocaleString('vi-VN')} đ</option>)}</select></label><label className="w-full lg:w-32"><span className="field-label">Số lượng</span><input disabled={!editable || busy} min="1" type="number" value={quantity} onChange={(event) => setQuantity(event.target.value)} className="input-base" /></label><Button disabled={!editable || !serviceId || busy} onClick={() => void add()}>Thêm chỉ định</Button></div>
      {catalog.error && <p className="mt-3 text-sm text-rose-600">{catalog.error}</p>}
    </Card>

    {orders.loading ? <Card className="grid min-h-56 place-items-center"><span className="size-9 animate-spin rounded-full border-4 border-teal-100 border-t-teal-700" /></Card> : orders.error ? <Card className="p-8 text-center"><XCircle className="mx-auto size-10 text-rose-500" /><p className="mt-3 text-sm text-slate-500">{orders.error}</p><Button className="mt-5" onClick={orders.refresh}><RefreshCw className="size-4" /> Thử lại</Button></Card> : !orders.data?.length ? <EmptyState icon={<FlaskConical className="size-6" />} title="Chưa có chỉ định" body="Các dịch vụ được chỉ định trong lượt khám sẽ hiển thị ở đây." /> : <Card className="overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-start sm:justify-between"><div><h2 className="font-display text-lg font-bold text-slate-900">Danh sách chỉ định</h2><p className="mt-1 text-sm text-slate-500">Ordered → kỹ thuật viên nhập kết quả → Completed. Chỉ Completed mới được tính vào hóa đơn sau khi bệnh án chốt.</p></div><Button variant="secondary" disabled title="FoMed API chưa có endpoint upload attachment cho chỉ định"><Paperclip className="size-4" /> Đính kèm file</Button></div>
      <div className="flex items-start gap-2 border-b border-amber-100 bg-amber-50/70 px-5 py-3 text-xs leading-5 text-amber-800"><Info className="mt-0.5 size-4 shrink-0" /><span><strong>Định dạng dự kiến:</strong> JPG, PNG, PDF, DICOM. FoMed-API hiện chưa có endpoint upload/download attachment, nên nút đính kèm đang ở trạng thái chờ API.</span></div>
      <div className="overflow-x-auto"><table className="data-table min-w-[980px]"><thead><tr><th>Dịch vụ</th><th>SL</th><th>Đơn giá snapshot</th><th>Kết quả</th><th>Trạng thái</th><th className="min-w-[190px]">Thao tác</th></tr></thead><tbody>{orders.data.map((order) => { const status = statusLabel[order.status] ?? { label: `Mã ${order.status}`, tone: 'neutral' as const }; return <tr key={order.id}><td><strong className="text-slate-800">{order.serviceName}</strong><small className="mt-1 block text-xs text-slate-400">Chỉ định #{order.id}</small></td><td>{order.quantity}</td><td>{order.unitPriceSnapshot.toLocaleString('vi-VN')} đ</td><td><span className="block max-w-xs whitespace-normal">{order.resultSummary || order.conclusion || 'Chưa có kết quả'}</span>{order.referenceRange && <small className="text-slate-400">Tham chiếu: {order.referenceRange}</small>}{order.resultAt && <small className="block text-xs text-slate-400">Ghi nhận: {new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(order.resultAt))}</small>}</td><td><Badge tone={status.tone}>{status.label}</Badge></td><td><ActionCell order={order} editable={editable} busy={busy} onCancel={setCancelingId} /></td></tr> })}</tbody></table></div>
    </Card>}

    {cancelingId !== null && <div className="fixed inset-0 z-[80] grid place-items-center bg-slate-950/40 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="cancel-order-title"><div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl sm:p-8"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.15em] text-rose-600">VC-14 · Chỉ định cận lâm sàng</p><h2 id="cancel-order-title" className="mt-1 font-display text-2xl font-bold text-slate-900">Hủy chỉ định?</h2></div><button type="button" aria-label="Đóng" onClick={() => setCancelingId(null)} className="grid size-9 shrink-0 place-items-center rounded-xl text-slate-400 hover:bg-slate-100" disabled={busy}><X className="size-5" /></button></div><p className="mt-4 text-sm leading-6 text-slate-600">Chỉ định chỉ được hủy khi còn trạng thái <strong>Ordered</strong>. Nếu kỹ thuật viên đã nhập kết quả, chỉ định sẽ giữ trạng thái <strong>Completed</strong> và vẫn được tính phí.</p><div className="mt-7 flex justify-end gap-3"><Button type="button" variant="secondary" onClick={() => setCancelingId(null)} disabled={busy}>Giữ lại</Button><Button type="button" variant="danger" onClick={() => void cancel(cancelingId)} disabled={busy}>{busy ? 'Đang hủy...' : 'Xác nhận hủy'}</Button></div></div></div>}
  </AppShell>
}
