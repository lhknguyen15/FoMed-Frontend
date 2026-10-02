import { CheckCircle2, PackageCheck, RefreshCw, Search, XCircle } from 'lucide-react'
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import AppShell from '../../../components/AppShell'
import { Badge, Button, Card, EmptyState, PageTitle } from '../../../components/ui'
import { pharmacyApi } from '../../../features/pharmacy/api/pharmacy-api'
import type { DispensePrescriptionResponse } from '../../../features/pharmacy/types/pharmacy'
import { formatDateTime } from '../../../shared/utils/format-date'

export default function PharmacyDispensePage() {
  const { prescriptionId } = useParams()
  const [id, setId] = useState(prescriptionId && prescriptionId !== '0' ? prescriptionId : '')
  const [result, setResult] = useState<DispensePrescriptionResponse | null>(null)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const dispense = async () => {
    const prescription = Number(id)
    if (!Number.isInteger(prescription) || prescription <= 0) { setNotice({ type: 'error', text: 'Vui lòng nhập mã đơn thuốc hợp lệ.' }); return }
    setBusy(true); setNotice(null)
    try {
      const response = await pharmacyApi.dispense(prescription)
      setResult(response)
      setNotice({ type: 'success', text: response.alreadyDispensed ? 'Đơn thuốc đã được phát trước đó. API đã xử lý idempotent.' : 'Đã phát thuốc thành công theo nguyên tắc FEFO.' })
    } catch (error) { setNotice({ type: 'error', text: error instanceof Error ? error.message : 'Không thể phát thuốc.' }) } finally { setBusy(false) }
  }

  return <AppShell><PageTitle eyebrow="Nhà thuốc" title="Phát thuốc" description="Nhập mã đơn thuốc để phân bổ tồn kho theo lô hết hạn sớm trước." />
    {notice && <p role={notice.type === 'error' ? 'alert' : 'status'} className={`mb-5 flex items-center gap-2 rounded-xl border p-3 text-sm font-semibold ${notice.type === 'error' ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>{notice.type === 'error' ? <XCircle className="size-5" /> : <CheckCircle2 className="size-5" />}{notice.text}</p>}
    <Card className="mb-5 p-5"><div className="flex flex-col gap-3 sm:flex-row sm:items-end"><label className="min-w-0 flex-1"><span className="field-label"><Search className="size-4" /> Mã đơn thuốc</span><input value={id} onChange={(event) => setId(event.target.value.replace(/\D/g, ''))} className="input-base" placeholder="Ví dụ: 332" inputMode="numeric" /></label><Button disabled={busy} onClick={() => void dispense()}><PackageCheck className="size-4" /> {busy ? 'Đang xử lý...' : 'Xác nhận phát thuốc'}</Button></div><p className="mt-3 text-xs text-slate-500">API sẽ tự động chọn nhiều lô nếu cần và không trừ kho lần hai khi bấm lại.</p></Card>
    {!result ? <EmptyState icon={<PackageCheck className="size-6" />} title="Chưa có lượt phát thuốc" body="Nhập mã đơn thuốc để xem các lô được phân bổ và số lượng xuất kho." /> : <Card className="overflow-hidden"><div className="flex flex-col justify-between gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center"><div><h2 className="font-display text-lg font-bold text-slate-900">Chi tiết xuất thuốc</h2><p className="mt-1 text-sm text-slate-500">Đơn #{result.prescriptionId} · {formatDateTime(result.dispensedAt)}</p></div><Badge tone={result.alreadyDispensed ? 'info' : 'success'}>{result.alreadyDispensed ? 'Đã phát trước đó' : 'Đã phát'}</Badge></div>{!result.lines.length ? <p className="p-8 text-center text-sm text-slate-500">Đơn thuốc không có dòng thuốc.</p> : <div className="overflow-x-auto"><table className="data-table"><thead><tr><th>Thuốc</th><th>Lô xuất</th><th>SL xuất</th><th>Hạn dùng</th></tr></thead><tbody>{result.lines.map((line) => <tr key={`${line.prescriptionItemId}-${line.batchId}`}><td><strong>{line.medicineName}</strong></td><td>{line.lotNumber}</td><td>{line.quantity}</td><td>{new Intl.DateTimeFormat('vi-VN').format(new Date(line.expiryDate))}</td></tr>)}</tbody></table></div>}<div className="flex justify-end border-t border-slate-100 p-4"><Button variant="secondary" onClick={() => { setResult(null); setNotice(null) }}><RefreshCw className="size-4" /> Phát đơn khác</Button></div></Card>}
  </AppShell>
}
