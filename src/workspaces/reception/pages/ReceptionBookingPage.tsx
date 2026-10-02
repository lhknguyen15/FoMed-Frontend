import { CalendarDays, CheckCircle2, Clock3, Search, Stethoscope, UserPlus, UserRound, XCircle } from 'lucide-react'
import { useMemo, useState } from 'react'
import AppShell from '../../../components/AppShell'
import { Badge, Button, Card, PageTitle } from '../../../components/ui'
import { appointmentApi } from '../../../features/appointments/api/appointment-api'
import { catalogApi } from '../../../features/catalogs/api/catalog-api'
import { patientStaffApi } from '../../../features/patients/api/patient-api'
import type { Patient } from '../../../features/patients/types/patient'
import { useApiQuery } from '../../../shared/hooks/useApiQuery'
import { toDateInput } from '../../../shared/utils/format-date'
import QuickPatientModal from '../components/QuickPatientModal'

const today = toDateInput(new Date())
export default function ReceptionBookingPage() {
  const [patientKeyword, setPatientKeyword] = useState('')
  const [patientQuery, setPatientQuery] = useState('')
  const [patient, setPatient] = useState<Patient | null>(null)
  const [source, setSource] = useState<'1' | '2'>('1')
  const [specialtyId, setSpecialtyId] = useState('')
  const [doctorId, setDoctorId] = useState('')
  const [serviceId, setServiceId] = useState('')
  const [date, setDate] = useState(today)
  const [slot, setSlot] = useState('')
  const [reason, setReason] = useState('')
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [quickCreateOpen, setQuickCreateOpen] = useState(false)
  const patients = useApiQuery(`reception-booking-patients-${patientQuery}`, () => patientQuery.trim() ? patientStaffApi.search(/^\d{7,}$/.test(patientQuery.replace(/\s/g, '')) ? { phone: patientQuery } : patientQuery.startsWith('BN') ? { patientCode: patientQuery } : { name: patientQuery }) : Promise.resolve([]))
  const specialties = useApiQuery('reception-booking-specialties', catalogApi.specialties)
  const doctors = useApiQuery(`reception-booking-doctors-${specialtyId}`, () => catalogApi.doctors(specialtyId ? Number(specialtyId) : undefined))
  const services = useApiQuery('reception-booking-services', catalogApi.services)
  const slots = useApiQuery(`reception-booking-slots-${doctorId}-${date}-${serviceId}`, () => doctorId ? appointmentApi.availableSlots(Number(doctorId), date, serviceId ? Number(serviceId) : undefined) : Promise.resolve([]))
  const available = useMemo(() => slots.data?.filter((item) => item.isAvailable) ?? [], [slots.data])
  const doctor = doctors.data?.find((item) => item.doctorId === Number(doctorId))
  const hasPatient = Boolean(patient)
  const chooseAnotherPatient = () => { setPatient(null); setSpecialtyId(''); setDoctorId(''); setServiceId(''); setSlot(''); setError('') }

  const book = async () => {
    if (!patient || !doctorId || !slot) return
    setSubmitting(true)
    setSuccess('')
    setError('')
    try {
      const result = await appointmentApi.staffBook({ patientId: patient.patientId, doctorId: Number(doctorId), startTime: slot, serviceId: serviceId ? Number(serviceId) : undefined, source: Number(source) as 1 | 2, reason: reason.trim() || undefined })
      setSuccess(`Đã đặt lịch ${result.appointmentCode} cho ${patient.fullName}.`)
      setSlot('')
    } catch (value) {
      setError(value instanceof Error ? value.message : 'Không thể đặt lịch hộ.')
    } finally {
      setSubmitting(false)
    }
  }

  return <AppShell>
    <PageTitle eyebrow="Bàn tiếp đón" title="Đặt lịch hộ / khách vãng lai" description="Chọn bệnh nhân trước, sau đó chọn bác sĩ và khung giờ. Nếu chưa có hồ sơ, hãy tạo nhanh ngay tại trang này." action={<Button variant="secondary" onClick={() => setQuickCreateOpen(true)}><UserPlus className="size-4" /> Tạo nhanh hồ sơ</Button>} />
    {success && <p role="status" className="mb-5 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-700"><CheckCircle2 className="size-5" />{success}</p>}
    {error && <p role="alert" className="mb-5 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-700"><XCircle className="size-5" />{error}</p>}
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]"><Card className="p-5 sm:p-6">
      <div className="grid gap-5 md:grid-cols-2"><section className="md:col-span-2"><span className="field-label"><UserRound className="size-4 text-teal-700" />Bước 1 · Chọn bệnh nhân *</span><div className="flex gap-2"><input value={patientKeyword} onChange={(event) => setPatientKeyword(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') setPatientQuery(patientKeyword.trim()) }} placeholder="Nhập tên, số điện thoại hoặc mã BN rồi bấm Tìm" className="input-base" /><Button type="button" onClick={() => setPatientQuery(patientKeyword.trim())}><Search className="size-4" /> Tìm</Button></div>{patientQuery && patients.loading && <p className="mt-3 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">Đang tìm bệnh nhân...</p>}{patientQuery && patients.error && <p className="mt-3 rounded-xl bg-rose-50 p-4 text-sm text-rose-700">{patients.error}</p>}{patientQuery && !patients.loading && !patients.error && !patient && <div className="mt-3 overflow-hidden rounded-xl border border-slate-200"><div className="grid grid-cols-[minmax(0,1.4fr)_minmax(110px,.8fr)_auto] gap-3 bg-slate-50 px-4 py-2 text-[11px] font-bold uppercase tracking-wide text-slate-500"><span>Bệnh nhân</span><span>Liên hệ</span><span /></div>{patients.data?.length ? patients.data.map((item) => <button type="button" key={item.patientId} onClick={() => { setPatient(item); setPatientQuery(''); setError('') }} className="grid w-full grid-cols-[minmax(0,1.4fr)_minmax(110px,.8fr)_auto] items-center gap-3 border-t border-slate-100 px-4 py-3 text-left text-sm hover:bg-teal-50"><span className="min-w-0"><strong className="block truncate text-slate-900">{item.fullName}</strong><small className="block truncate text-slate-500">{item.patientCode}</small></span><span className="min-w-0 truncate text-slate-600">{item.phone || 'Chưa có SĐT'}</span><Badge tone={item.userId ? 'info' : 'neutral'}>{item.userId ? 'Có tài khoản' : 'Vãng lai'}</Badge></button>) : <p className="p-5 text-center text-sm text-slate-500">Không tìm thấy bệnh nhân phù hợp.</p>}</div>}{patient && <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-teal-200 bg-teal-50 p-3 text-sm"><span className="min-w-0"><strong className="block truncate text-teal-950">{patient.fullName}</strong><span className="block truncate text-teal-700">{patient.patientCode} · {patient.phone}</span></span><div className="flex shrink-0 items-center gap-2"><Badge tone={patient.userId ? 'info' : 'neutral'}>{patient.userId ? 'Có tài khoản' : 'Vãng lai'}</Badge><button type="button" className="font-semibold text-teal-800 hover:text-teal-950" onClick={chooseAnotherPatient}>Đổi</button></div></div>}</section>
        <label><span className="field-label">Nguồn đặt</span><select disabled={!hasPatient} value={source} onChange={(event) => setSource(event.target.value as '1' | '2')} className="input-base"><option value="1">Điện thoại</option><option value="2">Khách đến trực tiếp</option></select></label>
        <label><span className="field-label"><Stethoscope className="size-4 text-teal-700" />Bước 2 · Chuyên khoa *</span><select disabled={!hasPatient} value={specialtyId} onChange={(event) => { setSpecialtyId(event.target.value); setDoctorId(''); setSlot('') }} className="input-base"><option value="">Chọn chuyên khoa</option>{specialties.data?.map((item) => <option key={item.specialtyId} value={item.specialtyId}>{item.name}</option>)}</select></label>
        <label><span className="field-label">Bác sĩ *</span><select disabled={!hasPatient} value={doctorId} onChange={(event) => { setDoctorId(event.target.value); setSlot('') }} className="input-base"><option value="">Chọn bác sĩ</option>{doctors.data?.map((item) => <option key={item.doctorId} value={item.doctorId}>{item.title ? `${item.title} ` : ''}{item.fullName}</option>)}</select></label>
        <label><span className="field-label">Dịch vụ</span><select disabled={!hasPatient} value={serviceId} onChange={(event) => { setServiceId(event.target.value); setSlot('') }} className="input-base"><option value="">Khám với bác sĩ</option>{services.data?.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <label><span className="field-label"><CalendarDays className="size-4 text-teal-700" />Ngày *</span><input disabled={!hasPatient} type="date" min={today} value={date} onChange={(event) => { setDate(event.target.value); setSlot('') }} className="input-base" /></label>
      </div>
      {!hasPatient && <p className="mt-6 rounded-xl border border-dashed border-teal-200 bg-teal-50/50 p-5 text-center text-sm text-teal-800">Hãy chọn bệnh nhân ở Bước 1 để mở thông tin chuyên khoa và khung giờ.</p>}
      <div className="mt-7"><div className="flex items-center justify-between"><h2 className="font-display text-lg font-bold text-slate-900">Bước 3 · Khung giờ trống</h2>{doctor && <span className="text-sm text-slate-500">{doctor.fullName}</span>}</div>{!hasPatient ? null : !doctorId ? <p className="mt-3 rounded-xl border border-dashed border-slate-200 p-7 text-center text-sm text-slate-500">Chọn bác sĩ để xem khung giờ.</p> : slots.loading ? <p className="mt-3 rounded-xl bg-slate-50 p-7 text-center text-sm text-slate-500">Đang tải khung giờ...</p> : slots.error ? <p className="mt-3 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{slots.error}</p> : !available.length ? <p className="mt-3 rounded-xl border border-dashed border-slate-200 p-7 text-center text-sm text-slate-500">Không còn khung giờ trong ngày này.</p> : <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">{available.map((item) => <button type="button" key={item.startTime} onClick={() => setSlot(item.startTime)} className={`rounded-xl border px-3 py-2 text-sm font-bold ${slot === item.startTime ? 'border-teal-600 bg-teal-50 text-teal-800' : 'border-slate-200 text-slate-600 hover:border-teal-300'}`}><Clock3 className="mr-1 inline size-4" />{new Intl.DateTimeFormat('vi-VN', { timeStyle: 'short' }).format(new Date(item.startTime))}</button>)}</div>}</div>
      <label className="mt-6 block"><span className="field-label">Lý do khám</span><textarea disabled={!hasPatient} rows={2} maxLength={500} value={reason} onChange={(event) => setReason(event.target.value)} className="input-base resize-none" /></label>
     </Card><Card className="h-fit p-5 sm:p-6"><h2 className="font-display text-lg font-bold text-slate-900">Xác nhận đặt lịch</h2><div className="my-5 space-y-3 border-y border-slate-100 py-5 text-sm"><p className="flex justify-between gap-3"><span className="text-slate-500">Bệnh nhân</span><strong className="text-right">{patient?.fullName || 'Chưa chọn'}</strong></p><p className="flex justify-between gap-3"><span className="text-slate-500">Bác sĩ</span><strong className="text-right">{doctor?.fullName || 'Chưa chọn'}</strong></p><p className="flex justify-between gap-3"><span className="text-slate-500">Thời gian</span><strong className="text-right">{slot ? new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(slot)) : 'Chưa chọn'}</strong></p></div><Button className="w-full" disabled={!patient || !doctorId || !slot || submitting} onClick={() => void book()}>{submitting ? 'Đang đặt lịch...' : 'Đặt lịch'}</Button></Card></div>
    {quickCreateOpen && <QuickPatientModal onClose={() => setQuickCreateOpen(false)} onCreated={(createdPatient) => { setPatient(createdPatient); setPatientKeyword(''); setPatientQuery(''); setQuickCreateOpen(false); setSuccess(`Đã tạo hồ sơ vãng lai ${createdPatient.patientCode}. Bạn có thể tiếp tục chọn lịch khám.`); setError('') }} />}
  </AppShell>
}
