import { notify } from '../../../shared/notifications/notify'
import { displayError } from '../../../shared/api/user-messages'
import { ArrowLeft, FlaskConical, X, XCircle } from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import AppShell from '../../../components/AppShell'
import { Button, Card, PageTitle } from '../../../components/ui'
import ServiceOrderResults from '../../../features/clinical/components/ServiceOrderResults'
import { useRecordServiceOrders } from '../../../features/clinical/hooks/useRecordServiceOrders'
import AttachmentPanel from '../../../features/clinical/components/AttachmentPanel'
import { clinicalApi } from '../../../features/clinical/api/clinical-api'
import type { ServiceOrder } from '../../../features/clinical/types/clinical'
import { useApiQuery } from '../../../shared/hooks/useApiQuery'

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
  const [notice, setNotice] = useState<{ type: 'error'; text: string } | null>(null)
  const record = useApiQuery(`doctor-services-record-${id}`, () => clinicalApi.record(id))
  const orders = useRecordServiceOrders(id)
  const catalog = useApiQuery('doctor-services-catalog', () => clinicalApi.servicesCatalog())
  const editable = Boolean(record.data?.id === id && !record.data.isFinalized && !record.loading && !record.error)

  const add = async () => {
    if (!serviceId || busy || !editable || record.loading || record.error || catalog.loading || catalog.error) return
    const requestedQuantity = Number(quantity)
    if (!Number.isInteger(requestedQuantity) || requestedQuantity < 1 || requestedQuantity > 1000) { setNotice({ type: 'error', text: 'Số lượng chỉ định phải là số nguyên từ 1 đến 1000.' }); return }
    setBusy(true)
    setNotice(null)
    try {
      await clinicalApi.orderService(id, { serviceId: Number(serviceId), quantity: requestedQuantity })
      notify.success('Đã thêm chỉ định và lưu đơn giá tại thời điểm chỉ định.')
      setServiceId('')
      orders.refresh()
    } catch (error) {
      setNotice({ type: 'error', text: displayError(error, 'Không thể thêm chỉ định.') })
    } finally {
      setBusy(false)
    }
  }

  const cancel = async (orderId: number) => {
    if (busy || !editable || record.loading || record.error) return
    if (orders.loading || orders.error || !orders.data?.some(order => order.id === orderId && order.medicalRecordId === id && order.status === 0)) {
      setNotice({ type: 'error', text: 'Chỉ định có thể đã thay đổi. Vui lòng cập nhật kết quả trước khi hủy.' })
      return
    }
    setBusy(true)
    setNotice(null)
    try {
      await clinicalApi.cancelOrder(orderId)
      setCancelingId(null)
      notify.success('Đã hủy chỉ định. Chỉ định đã hủy sẽ không được đưa vào hóa đơn.')
      orders.refresh()
    } catch (error) {
      setNotice({ type: 'error', text: displayError(error, 'Không thể hủy chỉ định.') })
    } finally {
      setBusy(false)
    }
  }

  return <AppShell>
    <PageTitle eyebrow="Khám bệnh" title="Chỉ định & kết quả" description={`Bệnh án #${id} · chỉ định cận lâm sàng trong lượt khám.`} action={<Button variant="secondary" onClick={() => navigate(`/doctor/exam/${id}`)}><ArrowLeft className="size-4" /> Về bệnh án</Button>} />
    {notice && cancelingId === null && <p role="alert" className="mb-5 flex items-center gap-2 rounded-xl border p-3 text-sm font-semibold border-rose-200 bg-rose-50 text-rose-700"><XCircle className="size-5" />{notice.text}</p>}
    {!editable && record.data?.isFinalized && <p className="mb-5 rounded-xl border border-sky-200 bg-sky-50 p-3 text-sm font-semibold text-sky-700">Bệnh án đã chốt, chỉ có thể xem lại chỉ định và kết quả. Các chỉ định đang chờ cũng không thể hủy sau khi chốt bệnh án.</p>}

    <Card className="mb-5 p-5">
      <div className="mb-4 flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-sky-50 text-sky-700"><FlaskConical className="size-5" /></span><div><h2 className="font-display text-lg font-bold text-slate-900">Thêm chỉ định</h2><p className="text-sm text-slate-500">Đơn giá được lưu tại thời điểm chỉ định. Chỉ hoàn tất lượt khám khi không còn chỉ định chờ thực hiện.</p></div></div>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end"><label className="min-w-0 flex-1"><span className="field-label">Dịch vụ</span><select disabled={!editable || busy || catalog.loading} value={serviceId} onChange={(event) => setServiceId(event.target.value)} className="input-base"><option value="">Chọn dịch vụ cận lâm sàng</option>{catalog.data?.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.price.toLocaleString('vi-VN')} đ</option>)}</select></label><label className="w-full lg:w-32"><span className="field-label">Số lượng</span><input disabled={!editable || busy} min="1" max="1000" step="1" type="number" value={quantity} onChange={(event) => setQuantity(event.target.value)} className="input-base" /></label><Button disabled={!editable || !serviceId || busy || catalog.loading || !!catalog.error} onClick={() => void add()}>Thêm chỉ định</Button></div>
      {catalog.error && <p className="mt-3 text-sm text-rose-600">{catalog.error}</p>}
    </Card>

    <ServiceOrderResults orders={orders.data} loading={orders.loading} error={orders.error} updatedAt={orders.updatedAt} onRefresh={orders.refresh} renderAction={order => <ActionCell order={order} editable={editable} busy={busy} onCancel={setCancelingId} />} />

    {record.data && !record.error && <div className="mt-5"><AttachmentPanel recordId={id} canUpload={editable} /></div>}
    {cancelingId !== null && <div className="fixed inset-0 z-[80] grid place-items-center bg-slate-950/40 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="cancel-order-title"><div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl sm:p-8"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.15em] text-rose-600">Chỉ định cận lâm sàng</p><h2 id="cancel-order-title" className="mt-1 font-display text-2xl font-bold text-slate-900">Hủy chỉ định?</h2></div><button type="button" aria-label="Đóng" onClick={() => setCancelingId(null)} className="grid size-9 shrink-0 place-items-center rounded-xl text-slate-400 hover:bg-slate-100" disabled={busy}><X className="size-5" /></button></div><p className="mt-4 text-sm leading-6 text-slate-600">Chỉ định chỉ được hủy khi còn trạng thái <strong>chờ thực hiện</strong>. Nếu kỹ thuật viên đã nhập kết quả, chỉ định sẽ giữ trạng thái <strong>đã có kết quả</strong> và vẫn được tính phí.</p>{notice && <p role="alert" className="mt-4 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-700"><XCircle className="size-5 shrink-0" />{notice.text}</p>}<div className="mt-7 flex justify-end gap-3"><Button type="button" variant="secondary" onClick={() => setCancelingId(null)} disabled={busy}>Giữ lại</Button><Button type="button" variant="danger" onClick={() => void cancel(cancelingId)} disabled={busy}>{busy ? 'Đang hủy...' : 'Xác nhận hủy'}</Button></div></div></div>}
  </AppShell>
}
