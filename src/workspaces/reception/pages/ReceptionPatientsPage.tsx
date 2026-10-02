import { CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, History, PencilLine, Plus, Search, UserRound, X, XCircle } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import AppShell from '../../../components/AppShell'
import { Badge, Button, Card, EmptyState, PageTitle } from '../../../components/ui'
import { patientStaffApi } from '../../../features/patients/api/patient-api'
import type { Patient, PatientHistory } from '../../../features/patients/types/patient'
import { useApiQuery } from '../../../shared/hooks/useApiQuery'
import { formatDateTime } from '../../../shared/utils/format-date'

type FormValues = { fullName: string; phone: string; gender: string; dateOfBirth: string; address: string; nationalId: string; insuranceNumber: string; emergencyContactName: string; emergencyContactPhone: string; allergies: string }
const empty: FormValues = { fullName: '', phone: '', gender: '', dateOfBirth: '', address: '', nationalId: '', insuranceNumber: '', emergencyContactName: '', emergencyContactPhone: '', allergies: '' }
const formOf = (patient?: Patient | null): FormValues => patient ? { fullName: patient.fullName, phone: patient.phone ?? '', gender: patient.gender === null || patient.gender === undefined ? '' : String(patient.gender), dateOfBirth: patient.dateOfBirth ?? '', address: patient.address ?? '', nationalId: patient.nationalId ?? '', insuranceNumber: patient.insuranceNumber ?? '', emergencyContactName: patient.emergencyContactName ?? '', emergencyContactPhone: patient.emergencyContactPhone ?? '', allergies: patient.allergies ?? '' } : empty
const optionalText = (value: string) => value.trim() || undefined
const optionalPhone = (value: string) => { const digits = value.replace(/\D/g, ''); return digits || undefined }

export default function ReceptionPatientsPage() {
  const navigate = useNavigate()
  const [keyword, setKeyword] = useState('')
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Patient | null>(null)
  const [values, setValues] = useState<FormValues>(empty)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const pageSize = 10
  const [page, setPage] = useState(1)
  const filters = query.startsWith('BN') ? { patientCode: query } : /^\d{7,}$/.test(query.replace(/\s/g, '')) ? { phone: query } : { name: query }
  const patients = useApiQuery(`reception-patients-${query}-${page}`, () => patientStaffApi.search({ ...filters, page, pageSize }))
  const history = useApiQuery(`reception-patient-history-${selected?.patientId ?? 0}`, () => selected ? patientStaffApi.history(selected.patientId) : Promise.resolve<PatientHistory[]>([]))

  useEffect(() => { setValues(formOf(selected)) }, [selected])
  const update = (key: keyof FormValues, value: string) => setValues((current) => ({ ...current, [key]: value }))
  const resetForm = () => { setSelected(null); setValues({ ...empty }); setKeyword(''); setQuery(''); setPage(1); setError(''); setSuccess('Đã mở biểu mẫu tạo hồ sơ mới.') }
  const searchPatients = () => { setPage(1); setQuery(keyword.trim()); setSelected(null) }

  const save = async (event: FormEvent) => {
    event.preventDefault()
    if (!values.fullName.trim() || !values.phone.trim()) { setError('Họ tên và số điện thoại là bắt buộc.'); return }
    setSaving(true)
    setError('')
    setSuccess('')
    const request = { fullName: values.fullName.trim(), phone: optionalPhone(values.phone), gender: values.gender ? Number(values.gender) : undefined, dateOfBirth: values.dateOfBirth || undefined, address: optionalText(values.address), nationalId: optionalText(values.nationalId), insuranceNumber: optionalText(values.insuranceNumber), emergencyContactName: optionalText(values.emergencyContactName), emergencyContactPhone: optionalPhone(values.emergencyContactPhone), allergies: optionalText(values.allergies) }
    try {
      const result = selected ? await patientStaffApi.update(selected.patientId, request) : await patientStaffApi.create(request)
      setSelected(result)
      setSuccess(selected ? 'Đã cập nhật hồ sơ bệnh nhân.' : `Đã tạo bệnh nhân ${result.patientCode}.`)
      patients.refresh()
    } catch (value) {
      setError(value instanceof Error ? value.message : 'Không thể lưu hồ sơ bệnh nhân.')
    } finally {
      setSaving(false)
    }
  }

  return <AppShell>
    <PageTitle eyebrow="Bàn tiếp đón" title="Hồ sơ bệnh nhân" description="Tra cứu, tạo mới, cập nhật đầy đủ hồ sơ và xem lịch sử khám tại quầy." action={<Button type="button" variant="secondary" onClick={resetForm}><Plus className="size-4" /> Tạo hồ sơ mới</Button>} />
    {success && <p role="status" className="mb-5 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-700"><CheckCircle2 className="size-5" />{success}</p>}
    {error && <p role="alert" className="mb-5 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-700"><XCircle className="size-5" />{error}</p>}
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(420px,520px)]"><Card className="overflow-hidden">
      <div className="flex gap-3 border-b border-slate-100 p-4"><label className="relative block min-w-0 flex-1"><Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><input value={keyword} onChange={(event) => setKeyword(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') searchPatients() }} placeholder="Tìm theo tên, SĐT hoặc mã BN..." className="input-base !pl-10" /></label><Button type="button" onClick={searchPatients}><Search className="size-4" /> Tìm</Button></div>
      {patients.loading ? <div className="grid min-h-64 place-items-center"><span className="size-8 animate-spin rounded-full border-4 border-teal-100 border-t-teal-700" /></div> : patients.error ? <div className="p-8 text-center text-sm text-rose-600">{patients.error}<Button variant="secondary" className="ml-3" onClick={patients.refresh}>Thử lại</Button></div> : !patients.data?.length ? <EmptyState icon={<UserRound className="size-6" />} title="Không tìm thấy bệnh nhân" body="Thử tìm bằng tên, số điện thoại hoặc mã bệnh nhân khác." /> : <div className="divide-y divide-slate-100">{patients.data.map((patient) => <button type="button" key={patient.patientId} onClick={() => { setSelected(patient); setSuccess(''); setError('') }} className={`flex w-full items-center justify-between gap-4 p-4 text-left transition hover:bg-slate-50 ${selected?.patientId === patient.patientId ? 'bg-teal-50/60' : ''}`}><span className="flex min-w-0 items-center gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-sky-50 text-sky-700"><UserRound className="size-5" /></span><span className="min-w-0"><strong className="block truncate text-sm text-slate-900">{patient.fullName}</strong><small className="block truncate text-slate-500">{patient.patientCode} · {patient.phone || 'Chưa có SĐT'}</small></span></span><Badge tone={patient.userId ? 'info' : 'neutral'}>{patient.userId ? 'Có tài khoản' : 'Vãng lai'}</Badge></button>)}</div>}
      {patients.data?.length ? <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3"><span className="text-xs font-semibold text-slate-500">Trang {page} · {patients.data.length} hồ sơ</span><div className="flex gap-2"><Button type="button" variant="secondary" className="h-8 px-3 text-xs" disabled={page === 1 || patients.loading} onClick={() => setPage((current) => Math.max(1, current - 1))}><ChevronLeft className="size-4" /> Trước</Button><Button type="button" variant="secondary" className="h-8 px-3 text-xs" disabled={patients.data.length < pageSize || patients.loading} onClick={() => setPage((current) => current + 1)}>Sau <ChevronRight className="size-4" /></Button></div></div> : null}
    </Card><Card className="p-5 sm:p-6"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[.15em] text-teal-700">{selected ? 'Cập nhật hồ sơ' : 'Hồ sơ mới'}</p><h2 className="mt-1 font-display text-xl font-bold text-slate-900">{selected ? selected.patientCode : 'Tạo bệnh nhân'}</h2></div>{selected && <div className="flex gap-2"><Button variant="ghost" className="h-9 px-3 text-xs" onClick={() => setHistoryOpen(true)}><History className="size-4" /> Lịch sử khám</Button><Button className="h-9 px-3 text-xs" onClick={() => navigate('/reception/booking', { state: { patient: selected } })}><CalendarDays className="size-4" /> Đặt lịch</Button></div>}</div>
      <form onSubmit={save} className="mt-6 space-y-4"><div className="grid gap-4 sm:grid-cols-2"><Field label="Họ tên *" value={values.fullName} onChange={(value) => update('fullName', value)} /><Field label="Số điện thoại *" value={values.phone} onChange={(value) => update('phone', value)} type="tel" /><Field label="Giới tính" value={values.gender} onChange={(value) => update('gender', value)} select options={['', '0', '1', '2']} optionLabels={['Chưa chọn', 'Nam', 'Nữ', 'Khác']} /><Field label="Ngày sinh" value={values.dateOfBirth} onChange={(value) => update('dateOfBirth', value)} type="date" /><Field label="CCCD" value={values.nationalId} onChange={(value) => update('nationalId', value)} /><Field label="Số thẻ BHYT" value={values.insuranceNumber} onChange={(value) => update('insuranceNumber', value)} /><Field label="Địa chỉ" value={values.address} onChange={(value) => update('address', value)} className="sm:col-span-2" /><Field label="Liên hệ khẩn cấp" value={values.emergencyContactName} onChange={(value) => update('emergencyContactName', value)} /><Field label="SĐT liên hệ khẩn cấp" value={values.emergencyContactPhone} onChange={(value) => update('emergencyContactPhone', value)} type="tel" /></div><label className="block"><span className="mb-2 block text-sm font-semibold text-slate-700">Tiền sử dị ứng</span><textarea rows={3} value={values.allergies} onChange={(event) => update('allergies', event.target.value)} className="input-base resize-none" placeholder="Ghi nhận dị ứng để bác sĩ nhìn thấy khi khám..." /></label><div className="flex justify-end gap-3"><Button type="button" variant="secondary" onClick={resetForm}>Làm mới</Button><Button type="submit" disabled={saving}><PencilLine className="size-4" />{saving ? 'Đang lưu...' : 'Lưu hồ sơ'}</Button></div></form>
    </Card></div>
    {historyOpen && selected && <HistoryModal patient={selected} data={history.data ?? []} loading={history.loading} error={history.error} onClose={() => setHistoryOpen(false)} />}
  </AppShell>
}

function Field({ label, value, onChange, type = 'text', select = false, options = [], optionLabels = [], className = '' }: { label: string; value: string; onChange: (value: string) => void; type?: string; select?: boolean; options?: string[]; optionLabels?: string[]; className?: string }) { return <label className={`block ${className}`}><span className="mb-2 block text-sm font-semibold text-slate-700">{label}</span>{select ? <select value={value} onChange={(event) => onChange(event.target.value)} className="input-base">{options.map((option, index) => <option value={option} key={option}>{optionLabels[index] || option}</option>)}</select> : <input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="input-base" />}</label> }
function HistoryModal({ patient, data, loading, error, onClose }: { patient: Patient; data: PatientHistory[]; loading: boolean; error: string; onClose: () => void }) { return <div className="fixed inset-0 z-[80] overflow-y-auto bg-slate-950/40 p-4 backdrop-blur-sm" role="dialog" aria-modal="true"><div className="grid min-h-full place-items-center py-4"><div className="w-full max-w-4xl rounded-3xl bg-white p-6 shadow-2xl sm:p-8"><div className="flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-[.15em] text-teal-700">Lịch sử khám</p><h2 className="mt-1 font-display text-2xl font-bold text-slate-900">{patient.fullName}</h2></div><button aria-label="Đóng" onClick={onClose} className="grid size-9 place-items-center rounded-xl text-slate-400 hover:bg-slate-100"><X className="size-5" /></button></div>{loading ? <p className="py-10 text-center text-sm text-slate-500">Đang tải lịch sử...</p> : error ? <p className="py-10 text-center text-sm text-rose-600">{error}</p> : !data.length ? <p className="py-10 text-center text-sm text-slate-500">Chưa có lịch sử khám.</p> : <div className="mt-6 overflow-x-auto"><table className="data-table"><thead><tr><th>Mã lịch</th><th>Ngày khám</th><th>Bác sĩ</th><th>Chẩn đoán</th><th>Trạng thái</th></tr></thead><tbody>{data.map((item) => <tr key={item.appointmentId}><td>{item.appointmentCode}</td><td>{formatDateTime(item.startTime)}</td><td>{item.doctorName}</td><td>{item.diagnosis || '—'}</td><td><Badge tone={item.status === 3 ? 'success' : 'neutral'}>{item.statusName}</Badge></td></tr>)}</tbody></table></div>}</div></div></div> }
