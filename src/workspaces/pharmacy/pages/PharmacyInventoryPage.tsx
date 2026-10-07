import { displayError } from '../../../shared/api/user-messages'
import { notify } from '../../../shared/notifications/notify'
import { AlertTriangle, ArrowDownUp, ClipboardList, PackageOpen, Plus, RefreshCw, XCircle } from 'lucide-react'
import { useRef, useState } from 'react'
import AppShell from '../../../components/AppShell'
import { Badge, Button, Card, EmptyState, PageTitle } from '../../../components/ui'
import { clinicalApi } from '../../../features/clinical/api/clinical-api'
import { pharmacyApi } from '../../../features/pharmacy/api/pharmacy-api'
import type { InventoryBatch } from '../../../features/pharmacy/types/pharmacy'
import { useApiQuery } from '../../../shared/hooks/useApiQuery'
import { formatDateTime } from '../../../shared/utils/format-date'

type Modal = 'receive' | 'adjust' | 'transactions' | null

export default function PharmacyInventoryPage() {
  const [page, setPage] = useState(1); const [medicineId, setMedicineId] = useState(''); const [expiringBefore, setExpiringBefore] = useState(''); const [modal, setModal] = useState<Modal>(null); const [selected, setSelected] = useState<InventoryBatch | null>(null); const [busy, setBusy] = useState(false); const [notice, setNotice] = useState<{ type: 'error'; text: string } | null>(null)
  const mutationPending = useRef(false)
  const [receive, setReceive] = useState({ medicineId: '', lotNumber: '', expiryDate: '', quantity: '1' }); const [adjust, setAdjust] = useState({ quantity: '', reason: '' })
  const medicines = useApiQuery('pharmacy-medicines-catalog', () => clinicalApi.medicines())
  const inventory = useApiQuery(`pharmacy-inventory-${page}-${medicineId}-${expiringBefore}`, () => pharmacyApi.inventory(page, medicineId ? Number(medicineId) : undefined, expiringBefore || undefined)); const rows = inventory.data ?? []; const hasNext = rows.length === 50
  const transactions = useApiQuery(`pharmacy-transactions-${selected?.batchId ?? 0}`, () => selected ? pharmacyApi.transactions(selected.batchId) : Promise.resolve([]))

  const submitReceive = async () => {
    if (mutationPending.current || busy || modal !== 'receive' || medicines.loading || medicines.error) return
    const quantity = Number(receive.quantity)
    if (!receive.medicineId || !receive.lotNumber.trim() || !receive.expiryDate || !Number.isInteger(quantity) || quantity <= 0 || quantity > 2147483647) {
      setNotice({ type: 'error', text: 'Vui lòng nhập đủ thuốc, số lô, hạn dùng và số lượng nguyên dương hợp lệ.' }); return
    }
    mutationPending.current = true; setBusy(true); setNotice(null)
    try {
      await pharmacyApi.receiveStock({ medicineId: Number(receive.medicineId), lotNumber: receive.lotNumber.trim(), expiryDate: receive.expiryDate, quantity })
      setModal(null)
      setReceive({ medicineId: '', lotNumber: '', expiryDate: '', quantity: '1' })
      notify.success('Đã nhập lô thuốc vào kho.')
      inventory.refresh()
    } catch (error) { setNotice({ type: 'error', text: displayError(error, 'Không thể nhập lô thuốc.') }) }
    finally { mutationPending.current = false; setBusy(false) }
  }
  const submitAdjust = async () => {
    if (mutationPending.current || busy || modal !== 'adjust' || !selected) return
    const quantity = Number(adjust.quantity)
    if (!Number.isInteger(quantity) || quantity === 0 || Math.abs(quantity) > 1000000 || !adjust.reason.trim()) {
      setNotice({ type: 'error', text: 'Nhập số lượng nguyên khác 0, từ -1.000.000 đến 1.000.000 và lý do điều chỉnh.' }); return
    }
    mutationPending.current = true; setBusy(true); setNotice(null)
    try {
      await pharmacyApi.adjustStock({ batchId: selected.batchId, quantity, reason: adjust.reason.trim() })
      setModal(null)
      notify.success('Đã điều chỉnh tồn kho và lưu nhật ký thay đổi.')
      inventory.refresh()
      transactions.refresh()
    } catch (error) { setNotice({ type: 'error', text: displayError(error, 'Không thể điều chỉnh tồn kho.') }) }
    finally { mutationPending.current = false; setBusy(false) }
  }
  const close = () => { if (!mutationPending.current) { setModal(null); setNotice(null) } }
  const open = (next: Modal, batch?: InventoryBatch) => { if (mutationPending.current) return; setSelected(batch ?? null); setModal(next); setNotice(null); if (next === 'adjust') setAdjust({ quantity: '', reason: '' }) }

  return <AppShell><PageTitle eyebrow="Nhà thuốc" title="Kho thuốc" description="Theo dõi tồn theo từng lô, cảnh báo hạn dùng và lịch sử biến động kho." action={<div className="flex flex-wrap gap-2"><Button variant="secondary" onClick={inventory.refresh}><RefreshCw className="size-4" /> Làm mới</Button><Button onClick={() => open('receive')}><Plus className="size-4" /> Nhập lô nhanh</Button></div>} />
    <Card className="mb-5 p-4"><div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]"><label><span className="field-label">Thuốc</span><select value={medicineId} onChange={(event) => { setMedicineId(event.target.value); setPage(1) }} className="input-base"><option value="">Tất cả thuốc</option>{medicines.data?.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label><span className="field-label">Hạn dùng trước ngày</span><input type="date" value={expiringBefore} onChange={(event) => { setExpiringBefore(event.target.value); setPage(1) }} className="input-base" /></label><Button variant="secondary" className="self-end" onClick={() => { setMedicineId(''); setExpiringBefore(''); setPage(1) }}>Xóa lọc</Button></div></Card>
    {inventory.loading ? <Card className="grid min-h-72 place-items-center"><span className="size-9 animate-spin rounded-full border-4 border-teal-100 border-t-teal-700" /></Card> : inventory.error ? <Card className="p-8 text-center"><XCircle className="mx-auto size-10 text-rose-500" /><p className="mt-3 text-sm text-slate-500">{inventory.error}</p><Button className="mt-5" onClick={inventory.refresh}>Thử lại</Button></Card> : !rows.length ? <EmptyState icon={<PackageOpen className="size-6" />} title="Không có lô thuốc phù hợp" body="Thử thay đổi bộ lọc hoặc nhập thêm lô mới." /> : <Card className="overflow-hidden"><div className="flex items-center justify-between border-b border-slate-100 p-5"><div><h2 className="font-display text-lg font-bold text-slate-900">Tồn kho theo lô</h2><p className="mt-1 text-sm text-slate-500">Trang {page} · tối đa 50 lô</p></div><Badge tone={rows.some((row) => row.isExpired) ? 'danger' : 'success'}>{rows.filter((row) => row.isExpired).length} lô hết hạn</Badge></div><div className="overflow-x-auto"><table className="data-table"><thead><tr><th>Thuốc</th><th>Số lô</th><th>Hạn dùng</th><th>Tồn</th><th>Đơn giá</th><th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody>{rows.map((row) => <tr key={row.batchId}><td><strong>{row.medicineName}</strong><small className="block text-xs text-slate-400">{row.unit || 'Đơn vị chuẩn'}</small></td><td>{row.lotNumber}</td><td>{new Intl.DateTimeFormat('vi-VN').format(new Date(row.expiryDate))}</td><td><strong className={row.quantity <= 0 ? 'text-rose-600' : 'text-slate-800'}>{row.quantity}</strong></td><td>{row.unitPrice.toLocaleString('vi-VN')} đ</td><td>{row.isExpired ? <Badge tone="danger"><AlertTriangle className="mr-1 size-3" /> Hết hạn</Badge> : <Badge tone="success">Đang dùng</Badge>}</td><td><div className="flex flex-wrap gap-2"><Button variant="secondary" className="h-8 px-3 text-xs" onClick={() => open('transactions', row)}><ClipboardList className="size-3.5" /> Thẻ kho</Button><Button variant="ghost" className="h-8 px-3 text-xs" onClick={() => open('adjust', row)}><ArrowDownUp className="size-3.5" /> Điều chỉnh</Button></div></td></tr>)}</tbody></table></div><div className="flex items-center justify-between border-t border-slate-100 px-5 py-4 text-sm text-slate-500"><span>Hiển thị {rows.length} lô</span><span className="flex items-center gap-2"><Button variant="secondary" className="h-8 px-3 text-xs" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Trước</Button><span>Trang {page}{hasNext ? '' : ' · cuối'}</span><Button variant="secondary" className="h-8 px-3 text-xs" disabled={!hasNext} onClick={() => setPage((value) => value + 1)}>Sau</Button></span></div></Card>}
    {modal && <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/35 p-4" role="presentation" onMouseDown={event => { if (event.currentTarget === event.target) close() }}>
      <Card className="max-h-[90vh] w-full max-w-2xl overflow-auto p-5">
        <div role="dialog" aria-modal="true" aria-labelledby="inventory-dialog-title">
          <fieldset disabled={busy} className="min-w-0">
            {modal === 'receive' && <>
              <div className="mb-5"><h2 id="inventory-dialog-title" className="font-display text-xl font-bold text-slate-900">Nhập lô nhanh</h2><p className="mt-1 text-sm text-slate-500">Số lượng sẽ được cộng vào lô hiện có nếu số lô và hạn dùng trùng khớp.</p></div>
              {medicines.error && <p role="alert" className="mb-4 text-sm text-rose-700">{medicines.error}<Button variant="ghost" onClick={medicines.refresh}>Thử tải lại danh sách thuốc</Button></p>}
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="sm:col-span-2"><span className="field-label">Thuốc</span><select value={receive.medicineId} onChange={event => setReceive({ ...receive, medicineId: event.target.value })} className="input-base"><option value="">Chọn thuốc</option>{medicines.data?.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
                <label><span className="field-label">Số lô</span><input maxLength={50} value={receive.lotNumber} onChange={event => setReceive({ ...receive, lotNumber: event.target.value })} className="input-base" placeholder="LOT-2026-01" /></label>
                <label><span className="field-label">Hạn dùng</span><input type="date" value={receive.expiryDate} onChange={event => setReceive({ ...receive, expiryDate: event.target.value })} className="input-base" /></label>
                <label><span className="field-label">Số lượng</span><input min="1" max="2147483647" step="1" type="number" value={receive.quantity} onChange={event => setReceive({ ...receive, quantity: event.target.value })} className="input-base" /></label>
              </div>
              {notice && <p role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{notice.text}</p>}
              <div className="mt-5 flex justify-end gap-2"><Button variant="secondary" onClick={close}>Hủy</Button><Button disabled={busy || medicines.loading || !!medicines.error} onClick={() => void submitReceive()}><Plus className="size-4" />{busy ? 'Đang nhập...' : 'Nhập vào kho'}</Button></div>
            </>}
            {modal === 'adjust' && selected && <>
              <div className="mb-5"><h2 id="inventory-dialog-title" className="font-display text-xl font-bold text-slate-900">Điều chỉnh tồn kho</h2><p className="mt-1 text-sm text-slate-500">{selected.medicineName} · lô {selected.lotNumber} · tồn hiện tại {selected.quantity}</p></div>
              <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">Số dương tăng tồn kho, số âm giảm tồn kho. Thay đổi được ghi vào thẻ kho. Kiểm tra số lượng và lý do trước khi lưu.</p>
              <label><span className="field-label">Số lượng điều chỉnh</span><input min="-1000000" max="1000000" step="1" type="number" value={adjust.quantity} onChange={event => setAdjust({ ...adjust, quantity: event.target.value })} className="input-base" placeholder="+10 hoặc -5" /></label>
              <label className="mt-4 block"><span className="field-label">Lý do bắt buộc</span><textarea maxLength={255} value={adjust.reason} onChange={event => setAdjust({ ...adjust, reason: event.target.value })} className="input-base resize-none" rows={3} placeholder="Ví dụ: kiểm kê lệch thực tế..." /></label>
              {notice && <p role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{notice.text}</p>}
              <div className="mt-5 flex justify-end gap-2"><Button variant="secondary" onClick={close}>Hủy</Button><Button disabled={busy} onClick={() => void submitAdjust()}><ArrowDownUp className="size-4" />{busy ? 'Đang lưu...' : 'Lưu điều chỉnh'}</Button></div>
            </>}
            {modal === 'transactions' && selected && <>
              <div className="mb-5"><h2 id="inventory-dialog-title" className="font-display text-xl font-bold text-slate-900">Thẻ kho</h2><p className="mt-1 text-sm text-slate-500">{selected.medicineName} · lô {selected.lotNumber}</p></div>
              {transactions.loading ? <div className="grid min-h-40 place-items-center"><span className="size-8 animate-spin rounded-full border-4 border-teal-100 border-t-teal-700" /></div> : transactions.error ? <p role="alert" className="text-sm text-rose-600">{transactions.error}</p> : !transactions.data?.length ? <p className="rounded-xl bg-slate-50 p-5 text-center text-sm text-slate-500">Chưa có giao dịch.</p> : <div className="overflow-x-auto"><table className="data-table"><thead><tr><th>Thời gian</th><th>Loại</th><th>Số lượng</th><th>Tham chiếu</th></tr></thead><tbody>{transactions.data.map(transaction => <tr key={transaction.id}><td>{formatDateTime(transaction.createdAt)}</td><td>{transaction.type === 0 ? 'Nhập kho' : transaction.type === 1 ? 'Xuất thuốc' : 'Điều chỉnh'}</td><td className={transaction.quantity < 0 ? 'text-rose-600' : 'text-emerald-600'}>{transaction.quantity > 0 ? '+' : ''}{transaction.quantity}</td><td>{({ Receipt: 'Nhập kho', Adjustment: 'Điều chỉnh tồn kho', Prescription: 'Đơn thuốc' } as Record<string, string>)[transaction.refType ?? ''] || '—'} {transaction.refId ? `#${transaction.refId}` : ''}</td></tr>)}</tbody></table></div>}
              <div className="mt-5 flex justify-end"><Button variant="secondary" onClick={close}>Đóng</Button></div>
            </>}
          </fieldset>
        </div>
      </Card>
    </div>}
  </AppShell>
}
