import { notify } from '../../../shared/notifications/notify'
import { displayError } from '../../../shared/api/user-messages'
import { ArrowLeft, Printer, Pill, Save, Search, Trash2, TriangleAlert, XCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import AppShell from '../../../components/AppShell'
import { Badge, Button, Card, EmptyState, PageTitle } from '../../../components/ui'
import { clinicalApi } from '../../../features/clinical/api/clinical-api'
import type { PrescribingMedicine, Prescription, PrescriptionLineRequest } from '../../../features/clinical/types/clinical'
import { ApiError } from '../../../shared/api/api-error'
import { useApiQuery } from '../../../shared/hooks/useApiQuery'

export default function DoctorPrescriptionPage() {
  const { recordId } = useParams()
  return <PrescriptionEditor key={recordId} id={Number(recordId)} />
}

function PrescriptionEditor({ id }: { id: number }) {
  const navigate = useNavigate()
  const [lines, setLines] = useState<PrescriptionLineRequest[]>([])
  const [selected, setSelected] = useState<Record<number, PrescribingMedicine>>({})
  const [note, setNote] = useState('')
  const [ack, setAck] = useState(false)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState<{ type: 'error'; text: string } | null>(null)
  const [keyword, setKeyword] = useState('')
  const [filter, setFilter] = useState({ keyword: '', page: 1, revision: 0 })
  const record = useApiQuery(`doctor-prescription-record-${id}`, () => clinicalApi.record(id))
  const context = useApiQuery(`doctor-prescribing-context-${id}`, () => clinicalApi.prescribingContext(id, lines.map(line => line.medicineId)))
  const prescription = useApiQuery<Prescription | null>(`doctor-prescription-${id}`, async () => {
    try { return await clinicalApi.prescription(id) }
    catch (error) { if (error instanceof ApiError && error.status === 404) return null; throw error }
  })
  const medicines = useApiQuery(`medicine-search-${id}-${JSON.stringify(filter)}`, () => clinicalApi.searchMedicines(id, filter.keyword, filter.page))
  const allergies = context.data?.allergies?.trim()
  const editable = Boolean(record.data && !record.data.isFinalized && !prescription.data?.isDispensed &&
    !record.loading && !record.error && !prescription.loading && !prescription.error && !context.loading && !context.error)
  // Failed/loading requests never mean "no allergy"; router state is not authoritative medical data.
  const allergyText = context.loading ? 'Đang tải thông tin dị ứng...' : context.error ? 'Chưa tải được thông tin dị ứng.' : allergies || 'Chưa ghi nhận dị ứng trong hồ sơ.'

  useEffect(() => {
    if (!prescription.data) return
    setNote(prescription.data.note ?? '')
    setLines(prescription.data.items.map(item => ({ medicineId: item.medicineId, quantity: item.quantity, dosage: item.dosage ?? '', instruction: item.instruction ?? '' })))
  }, [prescription.data])

  useEffect(() => {
    if (!context.data) return
    setSelected(current => ({ ...current, ...Object.fromEntries(context.data!.medicines.map(m => [m.id, m])) }))
  }, [context.data])

  useEffect(() => {
    if (!medicines.data) return
    setSelected(current => ({ ...current, ...Object.fromEntries(medicines.data!.items.filter(m => current[m.id]).map(m => [m.id, m])) }))
  }, [medicines.data])

  useEffect(() => { setAck(false) }, [allergies])

  const medicineFor = (id: number) => selected[id] ?? context.data?.medicines.find(m => m.id === id)
  const addMedicine = (medicine: PrescribingMedicine) => {
    if (!editable || saving || lines.length >= 100 || medicine.availableQuantity <= 0 || lines.some(line => line.medicineId === medicine.id)) return
    setSelected(current => ({ ...current, [medicine.id]: medicine }))
    setLines(current => current.length >= 100 || current.some(line => line.medicineId === medicine.id) ? current : [...current, { medicineId: medicine.id, quantity: 1, dosage: '', instruction: '' }])
    setNotice(null)
  }
  const updateLine = (index: number, key: 'quantity' | 'dosage' | 'instruction', value: string) =>
    setLines(current => current.map((line, i) => i === index ? { ...line, [key]: key === 'quantity' ? Number(value) : value } : line))

  const save = async () => {
    if (!editable || saving) return
    if (!lines.length || lines.some(line => !Number.isInteger(line.quantity) || line.quantity < 1 || line.quantity > 100000 || !line.dosage.trim())) {
      setNotice({ type: 'error', text: 'Vui lòng chọn thuốc, số lượng nguyên dương và liều dùng cho tất cả dòng.' }); return
    }
    if (allergies && !ack) { setNotice({ type: 'error', text: 'Bệnh nhân có tiền sử dị ứng. Vui lòng kiểm tra và xác nhận trước khi lưu.' }); return }
    if (lines.some(line => line.quantity > (medicineFor(line.medicineId)?.availableQuantity ?? 0))) {
      setNotice({ type: 'error', text: 'Số lượng kê vượt tồn khả dụng. Vui lòng kiểm tra các dòng thuốc.' }); return
    }
    setSaving(true); setNotice(null)
    try {
      const request = { note: note.trim() || undefined, allergyAcknowledged: ack, items: lines }
      if (prescription.data) await clinicalApi.updatePrescription(id, request)
      else await clinicalApi.createPrescription(id, request)
      notify.success('Đã lưu đơn thuốc.')
      prescription.refresh(); context.refresh()
    } catch (error) {
      setNotice({ type: 'error', text: displayError(error, 'Không thể lưu đơn thuốc.') })
      if (error instanceof ApiError && error.status === 409) {
        context.refresh(); record.refresh(); medicines.refresh()
        // Keep unsaved dosage/quantity on stock conflict; only reload saved lines for a dispensing lock.
        if (error.message.includes('cấp phát')) prescription.refresh()
      }
    } finally { setSaving(false) }
  }

  return <AppShell>
    <PageTitle eyebrow="Khám bệnh" title="Kê đơn thuốc" description={`${context.data?.patientName || `Bệnh án #${id}`} · kiểm tra dị ứng và tồn thuốc trước khi lưu.`}
      action={<Button variant="secondary" onClick={() => navigate(`/doctor/exam/${id}`)}><ArrowLeft className="size-4" /> Về bệnh án</Button>} />
    {notice && <p role="alert" className="mb-5 flex items-start gap-2 rounded-xl border p-3 text-sm font-semibold border-rose-200 bg-rose-50 text-rose-700"><XCircle className="size-5 shrink-0" />{notice.text}</p>}
    {record.data?.isFinalized && <p className="mb-5 rounded-xl border border-sky-200 bg-sky-50 p-3 text-sm font-semibold text-sky-700">Bệnh án đã chốt, chỉ có thể xem lại đơn thuốc.</p>}
    {prescription.data?.isDispensed && <p role="status" className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-800">Đơn thuốc đã được cấp phát, không thể chỉnh sửa. Các dòng thuốc và lịch sử cấp phát được giữ nguyên.</p>}
    {[record.error, prescription.error, context.error].filter(Boolean).map((error, index) => <p role="alert" key={index} className="mb-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>)}
    {context.error && <Button variant="secondary" className="mb-4" onClick={context.refresh}>Tải lại hồ sơ kê đơn</Button>}
    <div className={`mb-5 flex items-start gap-2 rounded-xl border p-3 text-sm ${allergies ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-amber-200 bg-amber-50 text-amber-900'}`}>
      <TriangleAlert className="mt-0.5 size-5 shrink-0" /><div><strong className="block">Thông tin dị ứng từ hồ sơ bệnh nhân</strong><p>{allergyText}</p>
        <p className="mt-1 text-xs">Thông tin dạng văn bản; hệ thống chưa tự đối chiếu hoạt chất. Bác sĩ cần kiểm tra từng thuốc.</p></div>
    </div>
    {!record.data?.isFinalized && !prescription.data?.isDispensed && <Card className="mb-5 p-5 print:hidden">
      <h2 className="mb-3 font-semibold text-slate-900">Tìm và thêm thuốc</h2>
      <form className="flex flex-col gap-3 sm:flex-row" onSubmit={event => { event.preventDefault(); setFilter(current => ({ keyword: keyword.trim(), page: 1, revision: current.revision + 1 })) }}>
        <label className="min-w-0 flex-1"><span className="sr-only">Tìm thuốc theo tên</span><input type="search" maxLength={100} autoComplete="off" value={keyword} onChange={event => setKeyword(event.target.value)} className="input-base" placeholder="Nhập tên thuốc..." /></label>
        <Button type="submit" disabled={!editable || saving}><Search className="size-4" /> Tìm thuốc</Button>
      </form>
      <p className="mt-3 text-xs text-slate-500">Số lượng có thể cấp phát chỉ tính các lô còn hạn dùng. Tồn kho được kiểm tra lại khi lưu đơn và khi cấp phát thuốc.</p>
      {medicines.error ? <p role="alert" className="mt-4 text-sm text-rose-700">{medicines.error}<Button variant="ghost" onClick={medicines.refresh}>Thử lại</Button></p> : medicines.loading ? <p role="status" className="py-5 text-sm text-slate-500">Đang tìm thuốc...</p> : <>
        <div className="mt-4 grid max-h-80 gap-3 overflow-y-auto xl:grid-cols-2">{medicines.data?.items.map(medicine => {
          const added = lines.some(line => line.medicineId === medicine.id)
          return <div key={medicine.id} className="flex min-w-0 flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-3">
            <div className="min-w-0 flex-1"><p className="break-words text-sm font-semibold text-slate-800">{medicine.name}</p><p className="mt-1 text-xs text-slate-500">{medicine.price.toLocaleString('vi-VN')} đ / {medicine.unit || 'đơn vị'} · Tồn: {medicine.availableQuantity}</p></div>
            <Button variant="secondary" disabled={!editable || saving || added || medicine.availableQuantity <= 0 || lines.length >= 100} onClick={() => addMedicine(medicine)} aria-label={`Thêm thuốc ${medicine.name}`}>{added ? 'Đã chọn' : medicine.availableQuantity <= 0 ? 'Hết tồn hợp lệ' : 'Thêm thuốc'}</Button>
          </div>
        })}</div>
        {!medicines.data?.items.length && <p className="py-5 text-sm text-slate-500">Không tìm thấy thuốc phù hợp.</p>}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500"><span>{medicines.data?.totalCount ?? 0} thuốc · Trang {filter.page}</span><div className="flex gap-2">
          <Button variant="secondary" disabled={filter.page <= 1} onClick={() => setFilter(current => ({ ...current, page: current.page - 1 }))}>Trang trước</Button>
          <Button variant="secondary" disabled={filter.page * 20 >= (medicines.data?.totalCount ?? 0)} onClick={() => setFilter(current => ({ ...current, page: current.page + 1 }))}>Trang sau</Button>
        </div></div>
      </>}
    </Card>}
    <Card className="p-5"><div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-3"><Pill className="size-5 text-violet-700" /><h2 className="font-display text-lg font-bold text-slate-900">Danh sách thuốc</h2></div>
      <Button variant="secondary" disabled={!prescription.data || prescription.loading || saving} onClick={() => window.print()}><Printer className="size-4" /> In đơn</Button></div>
      {lines.length ? <div className="space-y-4">{lines.map((line, index) => {
        const medicine = medicineFor(line.medicineId)
        const saved = prescription.data?.items.find(item => item.medicineId === line.medicineId)
        const stockExceeded = editable && medicine && line.quantity > medicine.availableQuantity
        return <div key={line.medicineId} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="mb-3 flex flex-wrap items-start justify-between gap-2"><div className="min-w-0"><h3 className="break-words text-sm font-semibold text-slate-900">{medicine?.name || saved?.medicineName || `Thuốc #${line.medicineId}`}</h3>
            <p className="mt-1 text-xs text-slate-500">{(editable ? medicine?.price : saved?.unitPriceSnapshot)?.toLocaleString('vi-VN')} đ{!editable ? ' · Giá đã ghi nhận trên đơn' : ` · Tồn khả dụng: ${medicine?.availableQuantity ?? 'Đang tải'}`}</p></div>
            {stockExceeded && <Badge tone="danger">Vượt tồn khả dụng</Badge>}</div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[100px_1fr_1fr_200px_auto]">
            <label><span className="field-label">Số lượng</span><input disabled={!editable || saving} min={1} max={Math.min(100000, medicine?.availableQuantity ?? 100000)} step={1} type="number" value={line.quantity} onChange={event => updateLine(index, 'quantity', event.target.value)} className="input-base" /></label>
            <label><span className="field-label">Liều dùng</span><input disabled={!editable || saving} maxLength={255} value={line.dosage} onChange={event => updateLine(index, 'dosage', event.target.value)} className="input-base" placeholder="Ví dụ: 1 viên/lần" /></label>
            <label><span className="field-label">Hướng dẫn</span><input disabled={!editable || saving} maxLength={255} value={line.instruction ?? ''} onChange={event => updateLine(index, 'instruction', event.target.value)} className="input-base" placeholder="Sau ăn, sáng tối..." /></label>
            <div><span className="field-label">Cảnh báo dị ứng</span><p className="break-words rounded-lg bg-amber-50 p-2 text-xs text-amber-900">{allergyText}</p></div>
            <Button variant="ghost" className="self-end text-rose-600" disabled={!editable || saving} onClick={() => setLines(current => current.filter((_, i) => i !== index))} aria-label={`Xóa thuốc ${medicine?.name || saved?.medicineName || line.medicineId}`}><Trash2 className="size-4" /></Button>
          </div>
        </div>
      })}</div> : <EmptyState icon={<Pill className="size-6" />} title="Chưa có thuốc" body="Tìm và thêm thuốc có tồn khả dụng để tạo đơn." />}
      <label className="mt-5 block"><span className="field-label">Ghi chú đơn thuốc</span><textarea aria-label="Ghi chú đơn thuốc" disabled={!editable || saving} maxLength={500} value={note} onChange={event => setNote(event.target.value)} rows={3} className="input-base resize-none" /></label>
      {allergies && editable && <label className="mt-5 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"><input disabled={saving} type="checkbox" checked={ack} onChange={event => setAck(event.target.checked)} className="mt-1 size-4 accent-teal-700" /><span><strong className="block">Đã kiểm tra dị ứng thuốc</strong><small className="mt-1 block">Bắt buộc xác nhận vì hồ sơ đã ghi nhận tiền sử dị ứng.</small></span></label>}
      <div className="mt-5 flex justify-end"><Button disabled={!editable || saving || !lines.length} onClick={() => void save()}><Save className="size-4" /> {saving ? 'Đang lưu...' : prescription.data ? 'Cập nhật đơn thuốc' : 'Lưu đơn thuốc'}</Button></div>
    </Card>
  </AppShell>
}
