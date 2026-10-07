import { notify } from '../../../shared/notifications/notify'
import { displayError } from '../../../shared/api/user-messages'
import { PackageCheck, RefreshCw, Search, XCircle } from 'lucide-react'
import { useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import BatchAllocationTable from '../components/BatchAllocationTable'
import AppShell from '../../../components/AppShell'
import { Badge, Button, Card, EmptyState, PageTitle } from '../../../components/ui'
import { pharmacyApi } from '../../../features/pharmacy/api/pharmacy-api'
import type { DispensePrescriptionResponse, PharmacyPrescription } from '../../../features/pharmacy/types/pharmacy'
import { useApiQuery } from '../../../shared/hooks/useApiQuery'
import { formatDateTime } from '../../../shared/utils/format-date'

const validId = (value: string) => Number.isSafeInteger(Number(value)) && Number(value) > 0 && Number(value) <= 2147483647

export default function PharmacyDispensePage() {
  const { prescriptionId } = useParams()
  return <DispensingForm key={prescriptionId ?? 'search'} initialId={prescriptionId ?? ''} />
}

function DispensingForm({ initialId }: { initialId: string }) {
  const [id, setId] = useState(validId(initialId) ? initialId : '')
  const [requestedId, setRequestedId] = useState(validId(initialId) ? Number(initialId) : 0)
  const [result, setResult] = useState<DispensePrescriptionResponse | null>(null)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<{ type: 'error'; text: string } | null>(null)
  const mutationPending = useRef(false)
  const query = useApiQuery<PharmacyPrescription | null>(`pharmacy-prescription-${requestedId}`,
    () => requestedId ? pharmacyApi.prescription(requestedId) : Promise.resolve(null))
  const detail = validId(id) && Number(id) === requestedId && query.data?.prescriptionId === requestedId ? query.data : null
  const canDispense = Boolean(detail?.canDispense && !query.loading && !query.error && !busy && !result)

  const lookup = (event: React.FormEvent) => {
    event.preventDefault()
    if (!validId(id)) { setNotice({ type: 'error', text: 'Vui lòng nhập mã đơn thuốc hợp lệ.' }); return }
    setNotice(null)
    setResult(null)
    if (Number(id) === requestedId) query.refresh()
    else setRequestedId(Number(id))
  }

  const dispense = async () => {
    if (mutationPending.current || !canDispense || !detail) return
    mutationPending.current = true
    setBusy(true)
    setNotice(null)
    try {
      const response = await pharmacyApi.dispense(detail.prescriptionId)
      setResult(response)
      if (response.alreadyDispensed) notify.info('Đơn thuốc đã được phát trước đó. Tồn kho không bị trừ thêm.')
      else notify.success('Đã cấp phát thuốc, ưu tiên các lô hết hạn trước.')
    } catch (error) {
      setNotice({ type: 'error', text: displayError(error, 'Không thể phát thuốc.') })
    } finally {
      // Re-read after success or conflict; the server is authoritative if another operator acted.
      query.refresh()
      mutationPending.current = false
      setBusy(false)
    }
  }

  return <AppShell>
    <PageTitle eyebrow="Nhà thuốc" title="Phát thuốc" description="Tra cứu đơn, kiểm tra trạng thái rồi xác nhận cấp phát." action={<Link to="/pharmacy/dispense" className="inline-flex h-10 items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700">Danh sách đơn</Link>} />
    {notice && <p role="alert" className="mb-5 flex items-start gap-2 rounded-xl border p-3 text-sm font-semibold border-rose-200 bg-rose-50 text-rose-700"><XCircle className="size-5 shrink-0" />{notice.text}</p>}
    <Card className="mb-5 p-5">
      <form onSubmit={lookup} className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="min-w-0 flex-1"><span className="field-label">Mã đơn thuốc</span>
          <input value={id} disabled={busy} onChange={(event) => { setId(event.target.value.replace(/\D/g, '')); setResult(null); setNotice(null) }} className="input-base" placeholder="Ví dụ: 332" inputMode="numeric" />
        </label>
        <Button type="submit" disabled={busy || (requestedId > 0 && query.loading)}><Search className="size-4" /> Tra cứu đơn</Button>
      </form>
      <p className="mt-3 text-xs leading-5 text-slate-500">Chỉ cấp phát khi bệnh án đã chốt và lượt khám hoàn tất. Tình trạng đơn thuốc và tồn kho được kiểm tra lại trước khi xác nhận.</p>
    </Card>

    {requestedId > 0 && Number(id) === requestedId && query.loading ? <Card className="mb-5 grid min-h-48 place-items-center"><span role="status" aria-label="Đang tải đơn thuốc" className="size-9 animate-spin rounded-full border-4 border-teal-100 border-t-teal-700" /></Card> : requestedId > 0 && Number(id) === requestedId && query.error ? <Card className="mb-5 p-6"><p role="alert" className="text-sm text-rose-700">{query.error}</p><Button className="mt-4" variant="secondary" onClick={query.refresh}><RefreshCw className="size-4" /> Thử lại</Button></Card> : detail ? <Card className="mb-5 overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0"><h2 className="font-display text-lg font-bold text-slate-900">Đơn thuốc #{detail.prescriptionId}</h2><p className="mt-1 break-words text-sm font-semibold text-slate-700">{detail.patientName} · {detail.patientCode}</p><p className="mt-1 break-words text-sm text-slate-500">{detail.doctorName} · Bệnh án #{detail.medicalRecordId}</p></div>
        <Badge tone={detail.isFullyDispensed ? 'success' : detail.canDispense ? 'info' : 'warning'}>{detail.isFullyDispensed ? 'Đã phát đủ' : detail.canDispense ? 'Sẵn sàng cấp phát' : 'Chưa thể cấp phát'}</Badge>
      </div>
      {detail.blockedReason && <p role="status" className="border-b border-amber-100 bg-amber-50 px-5 py-3 text-sm font-semibold text-amber-800">{detail.blockedReason}</p>}
      <div className="overflow-x-auto"><table className="data-table min-w-[650px]"><thead><tr><th>Thuốc</th><th>SL kê</th><th>Đã phát</th><th>Liều dùng</th><th>Hướng dẫn</th></tr></thead><tbody>{detail.items.map((item) => <tr key={item.medicineId}><td><strong>{item.medicineName}</strong></td><td>{item.quantity}</td><td>{item.dispensedQuantity}</td><td className="max-w-xs whitespace-normal">{item.dosage || '—'}</td><td className="max-w-xs whitespace-normal">{item.instruction || '—'}</td></tr>)}</tbody></table></div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 p-5"><div><h3 className="text-sm font-bold text-slate-800">Phân bổ lô dự kiến</h3><p className="mt-1 text-xs text-slate-500">Phân bổ dự kiến chưa giữ chỗ hoặc trừ tồn kho. Lô thuốc và số lượng được kiểm tra lại khi xác nhận cấp phát.</p></div><Button variant="secondary" disabled={busy || query.loading} onClick={query.refresh}><RefreshCw className="size-4" />Tải lại tồn kho</Button></div>
      <BatchAllocationTable items={detail.items} />
      <div className="flex flex-col gap-3 border-t border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs leading-5 text-slate-500">Chỉ xác nhận khi có đủ thuốc để phát toàn bộ phần còn lại. Bấm lại không trừ kho lần hai.</p><Button className="shrink-0" disabled={!canDispense} onClick={() => void dispense()}><PackageCheck className="size-4" />{busy ? 'Đang xử lý...' : 'Xác nhận phát thuốc'}</Button></div>
    </Card> : <EmptyState icon={<PackageCheck className="size-6" />} title="Tra cứu đơn thuốc trước khi cấp phát" body="Nhập mã đơn và bấm Tra cứu đơn để kiểm tra bệnh nhân, danh sách thuốc và trạng thái." />}

    {result?.alreadyDispensed && result.prescriptionId === Number(id) && <p role="status" className="mb-5 rounded-xl border border-sky-200 bg-sky-50 p-3 text-sm font-semibold text-sky-800">Chi tiết bên dưới là lần cấp phát đã ghi nhận trước đó, không phải lần xuất kho mới.</p>}
    {result && result.prescriptionId === Number(id) && <Card className="overflow-hidden">
      <div className="flex flex-col justify-between gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center"><div><h2 className="font-display text-lg font-bold text-slate-900">Chi tiết xuất thuốc</h2><p className="mt-1 text-sm text-slate-500">Đơn #{result.prescriptionId} · {formatDateTime(result.dispensedAt)}</p></div><Badge tone="success">Đã phát</Badge></div>
      <div className="overflow-x-auto"><table className="data-table min-w-[550px]"><thead><tr><th>Thuốc</th><th>Lô xuất</th><th>SL xuất</th><th>Hạn dùng</th></tr></thead><tbody>{result.lines.map((line) => <tr key={`${line.prescriptionItemId}-${line.batchId}`}><td><strong>{line.medicineName}</strong></td><td>{line.lotNumber}</td><td>{line.quantity}</td><td>{new Intl.DateTimeFormat('vi-VN').format(new Date(`${line.expiryDate}T00:00:00`))}</td></tr>)}</tbody></table></div>
      <div className="flex justify-end border-t border-slate-100 p-4"><Button variant="secondary" onClick={() => { setId(''); setRequestedId(0); setResult(null); setNotice(null) }}><RefreshCw className="size-4" /> Phát đơn khác</Button></div>
    </Card>}
  </AppShell>
}
