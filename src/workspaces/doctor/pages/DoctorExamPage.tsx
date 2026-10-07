import { notify } from '../../../shared/notifications/notify'
import { displayError } from '../../../shared/api/user-messages'
import { ArrowLeft, ClipboardCheck, FlaskConical, History, Pill, Save, Stethoscope, XCircle } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import AppShell from '../../../components/AppShell'
import { Button, Card, PageTitle } from '../../../components/ui'
import { appointmentApi } from '../../../features/appointments/api/appointment-api'
import { clinicalApi } from '../../../features/clinical/api/clinical-api'
import type { SaveMedicalRecordRequest, VitalSigns } from '../../../features/clinical/types/clinical'
import DoctorHistoryEntries from '../components/DoctorHistoryEntries'
import { useApiQuery } from '../../../shared/hooks/useApiQuery'
import { formatDateTime } from '../../../shared/utils/format-date'

const emptyVitals: VitalSigns = { systolic: null, diastolic: null, heartRate: null, temperature: null, weightKg: null, heightCm: null }

export default function DoctorExamPage() {
  const { recordId } = useParams()
  const id = Number(recordId)
  const navigate = useNavigate()
  const location = useLocation()
  const navigationState = location.state as { patientName?: string } | null
  const [form, setForm] = useState<SaveMedicalRecordRequest>({ vitalSigns: emptyVitals })
  const [notice, setNotice] = useState<{ type: 'error'; text: string } | null>(null)
  const mutationPending = useRef(false)
  const [saving, setSaving] = useState(false)
  const [completing, setCompleting] = useState(false)
  const record = useApiQuery(`doctor-record-${id}`, () => clinicalApi.record(id))
  const prescribingContext = useApiQuery(`doctor-exam-prescribing-context-${id}`, () => id ? clinicalApi.prescribingContext(id) : Promise.resolve(null))
  const appointment = useApiQuery(`doctor-record-appointment-${record.data?.appointmentId ?? 0}`, () => record.data ? appointmentApi.getById(record.data.appointmentId) : Promise.resolve(null))
  const historyQuery = useApiQuery(`doctor-exam-history-${id}`, async () => ({ recordId: id, items: id ? await clinicalApi.recordHistory(id) : [] }))
  // useApiQuery retains old data during a key change: never show another record's history.
  const examHistory = historyQuery.data?.recordId === id ? historyQuery.data.items : []
  const historyLoading = historyQuery.loading || (!historyQuery.error && historyQuery.data?.recordId !== id)

  useEffect(() => {
    if (!record.data) return
    setForm({ symptoms: record.data.symptoms ?? '', diagnosis: record.data.diagnosis ?? '', note: record.data.note ?? '', icd10Code: record.data.icd10Code ?? '', treatmentPlan: record.data.treatmentPlan ?? '', followUpDate: record.data.followUpDate ?? '', vitalSigns: { ...emptyVitals, ...(record.data.vitalSigns ?? {}) } })
  }, [record.data])

  if (!id) return <AppShell><PageTitle eyebrow="Không gian bác sĩ" title="Chưa chọn bệnh án" description="Hãy chọn bệnh nhân từ hàng chờ để bắt đầu khám." action={<Button variant="secondary" onClick={() => navigate('/doctor/queue')}><ArrowLeft className="size-4" /> Về hàng chờ</Button>} /><Card className="p-8 text-center text-sm text-slate-500">Trang khám chỉ được mở sau khi bác sĩ bắt đầu một lượt khám.</Card></AppShell>

  const update = (key: keyof SaveMedicalRecordRequest, value: string) => setForm((current) => ({ ...current, [key]: value }))
  const updateVital = (key: keyof VitalSigns, value: string) => setForm((current) => ({ ...current, vitalSigns: { ...(current.vitalSigns ?? emptyVitals), [key]: value === '' ? null : Number(value) } }))

  const save = async () => {
    if (mutationPending.current || record.loading || record.error || record.data?.id !== id || record.data?.isFinalized) return
    mutationPending.current = true
    setSaving(true); setNotice(null)
    try { await clinicalApi.updateRecord(id, form); notify.success('Đã lưu thông tin bệnh án.'); record.refresh() } catch (error) { setNotice({ type: 'error', text: displayError(error, 'Không thể lưu bệnh án.') }) } finally { mutationPending.current = false; setSaving(false) }
  }

  const complete = async () => {
    if (mutationPending.current || record.loading || record.error || record.data?.id !== id || record.data?.isFinalized) return
    mutationPending.current = true
    setCompleting(true); setNotice(null)
    try { await clinicalApi.updateRecord(id, form); await appointmentApi.complete(record.data!.appointmentId); notify.success('Đã hoàn tất và chốt lượt khám.'); record.refresh() } catch (error) { setNotice({ type: 'error', text: displayError(error, 'Không thể hoàn tất lượt khám. Hãy kiểm tra chẩn đoán và các chỉ định còn chờ.') }) } finally { mutationPending.current = false; setCompleting(false) }
  }

  return <AppShell><PageTitle eyebrow="Khám bệnh" title={appointment.data?.patientName || navigationState?.patientName || `Bệnh án #${id}`} description={appointment.data ? `${appointment.data.appointmentCode} · ${formatDateTime(appointment.data.startTime)}` : 'Đang tải thông tin lượt khám...'} action={<div className="flex flex-wrap gap-2"><Button variant="secondary" onClick={() => navigate('/doctor/queue')}><ArrowLeft className="size-4" /> Hàng chờ</Button>{record.data && <Button disabled={record.data.isFinalized || completing || saving || record.loading || !!record.error || record.data.id !== id} onClick={() => void complete()}><ClipboardCheck className="size-4" /> {completing ? 'Đang chốt...' : 'Hoàn tất khám'}</Button>}</div>} />
    {notice && <p role="alert" className="mb-5 flex items-center gap-2 rounded-xl border p-3 text-sm font-semibold border-rose-200 bg-rose-50 text-rose-700"><XCircle className="size-5" />{notice.text}</p>}
    {record.loading ? <Card className="grid min-h-72 place-items-center"><span className="size-9 animate-spin rounded-full border-4 border-teal-100 border-t-teal-700" /></Card> : record.error || !record.data ? <Card className="p-8 text-center"><XCircle className="mx-auto size-10 text-rose-500" /><p className="mt-3 text-sm text-slate-500">{record.error || 'Không tìm thấy bệnh án.'}</p><Button className="mt-5" onClick={() => navigate('/doctor/queue')}>Về hàng chờ</Button></Card> : <>
      {record.data.isFinalized && <p className="mb-5 rounded-xl border border-sky-200 bg-sky-50 p-3 text-sm font-semibold text-sky-700">Bệnh án đã được chốt, chỉ có thể xem lại thông tin.</p>}
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_360px]"><Card className="p-5"><div className="mb-5 flex items-center justify-between"><div><h2 className="font-display text-lg font-bold text-slate-900">Bệnh án</h2><p className="mt-1 text-sm text-slate-500">Lưu nháp trước khi hoàn tất để tránh mất dữ liệu.</p></div><Stethoscope className="size-6 text-teal-700" /></div><div className="grid gap-4 md:grid-cols-2"><label className="md:col-span-2"><span className="field-label">Triệu chứng</span><textarea disabled={record.data.isFinalized || saving || completing} value={form.symptoms ?? ''} onChange={(event) => update('symptoms', event.target.value)} rows={3} className="input-base resize-none" placeholder="Mô tả triệu chứng chính..." /></label><label className="md:col-span-2"><span className="field-label">Chẩn đoán <span className="text-rose-500">*</span></span><textarea disabled={record.data.isFinalized || saving || completing} value={form.diagnosis ?? ''} onChange={(event) => update('diagnosis', event.target.value)} rows={3} className="input-base resize-none" placeholder="Nhập chẩn đoán để có thể chốt lượt khám..." /></label><label><span className="field-label">Mã ICD-10</span><input disabled={record.data.isFinalized || saving || completing} value={form.icd10Code ?? ''} onChange={(event) => update('icd10Code', event.target.value)} className="input-base" placeholder="Ví dụ: J06.9" /></label><label><span className="field-label">Ngày tái khám</span><input disabled={record.data.isFinalized || saving || completing} type="date" value={form.followUpDate ?? ''} onChange={(event) => update('followUpDate', event.target.value)} className="input-base" /></label><label className="md:col-span-2"><span className="field-label">Kế hoạch điều trị</span><textarea disabled={record.data.isFinalized || saving || completing} value={form.treatmentPlan ?? ''} onChange={(event) => update('treatmentPlan', event.target.value)} rows={3} className="input-base resize-none" placeholder="Thuốc, theo dõi và dặn dò..." /></label><label className="md:col-span-2"><span className="field-label">Ghi chú</span><textarea disabled={record.data.isFinalized || saving || completing} value={form.note ?? ''} onChange={(event) => update('note', event.target.value)} rows={3} className="input-base resize-none" placeholder="Ghi chú nội bộ..." /></label></div><div className="mt-5 flex justify-end"><Button disabled={record.data.isFinalized || saving || completing} onClick={() => void save()}><Save className="size-4" /> {saving ? 'Đang lưu...' : 'Lưu bệnh án'}</Button></div></Card>
        <div className="grid content-start gap-5"><Card className="p-5"><div className="mb-4"><h2 className="font-display text-lg font-bold text-slate-900">Sinh hiệu</h2><p className="mt-1 text-sm text-slate-500">Thông tin đo tại phòng khám.</p></div><div className="grid gap-3 sm:grid-cols-2"><label className="sm:col-span-2"><span className="field-label">Huyết áp <small className="font-normal text-slate-400">(mmHg)</small></span><div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2"><input disabled={!!record.data?.isFinalized || saving || completing} type="number" step="any" value={form.vitalSigns?.systolic ?? ''} onChange={(event) => updateVital('systolic', event.target.value)} className="input-base" placeholder="Tâm thu" /><span className="text-slate-400">/</span><input disabled={!!record.data?.isFinalized || saving || completing} type="number" step="any" value={form.vitalSigns?.diastolic ?? ''} onChange={(event) => updateVital('diastolic', event.target.value)} className="input-base" placeholder="Tâm trương" /></div></label><label><span className="field-label">Mạch <small className="font-normal text-slate-400">(bpm)</small></span><input disabled={!!record.data?.isFinalized || saving || completing} type="number" step="any" value={form.vitalSigns?.heartRate ?? ''} onChange={(event) => updateVital('heartRate', event.target.value)} className="input-base" placeholder="Nhịp/phút" /></label><label><span className="field-label">Nhiệt độ <small className="font-normal text-slate-400">(°C)</small></span><input disabled={!!record.data?.isFinalized || saving || completing} type="number" step="any" value={form.vitalSigns?.temperature ?? ''} onChange={(event) => updateVital('temperature', event.target.value)} className="input-base" placeholder="36.5" /></label><label><span className="field-label">Cân nặng <small className="font-normal text-slate-400">(kg)</small></span><input disabled={!!record.data?.isFinalized || saving || completing} type="number" step="any" value={form.vitalSigns?.weightKg ?? ''} onChange={(event) => updateVital('weightKg', event.target.value)} className="input-base" placeholder="kg" /></label><label><span className="field-label">Chiều cao <small className="font-normal text-slate-400">(cm)</small></span><input disabled={!!record.data?.isFinalized || saving || completing} type="number" step="any" value={form.vitalSigns?.heightCm ?? ''} onChange={(event) => updateVital('heightCm', event.target.value)} className="input-base" placeholder="cm" /></label></div></Card><Card className="p-5"><div className="mb-4 flex items-center justify-between"><div><h2 className="font-display text-lg font-bold text-slate-900">Lịch sử khám</h2><p className="mt-1 text-sm text-slate-500">5 lần khám đã chốt trước lượt hiện tại.</p></div><History className="size-5 text-slate-400" /></div><p className="mb-3 rounded-lg bg-amber-50 p-3 text-sm font-semibold text-amber-800">{prescribingContext.loading ? 'Đang tải dị ứng...' : prescribingContext.error ? 'Chưa tải được thông tin dị ứng từ hồ sơ.' : `Dị ứng: ${prescribingContext.data?.allergies || 'Chưa ghi nhận trong hồ sơ'}`}</p><DoctorHistoryEntries history={examHistory} loading={historyLoading} error={historyQuery.error} onRetry={historyQuery.refresh} /></Card></div></div>
      <div className="mt-5 flex flex-wrap gap-3"><Link to={`/doctor/exam/${id}/services`} className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-teal-300 hover:text-teal-800"><FlaskConical className="size-4 text-sky-700" /> Chỉ định cận lâm sàng</Link><Link to={`/doctor/exam/${id}/prescription`} state={{ patientName: appointment.data?.patientName || navigationState?.patientName }} className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-violet-300 hover:text-violet-800"><Pill className="size-4 text-violet-700" /> Kê đơn thuốc</Link></div>
    </>}
  </AppShell>
}
