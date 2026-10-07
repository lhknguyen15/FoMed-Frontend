import { displayError } from '../../../shared/api/user-messages'
import { CheckCircle2, UserRound, X, XCircle } from 'lucide-react'
import { useRef, useState, type FormEvent } from 'react'
import { Button } from '../../../components/ui'
import { patientStaffApi } from '../../../features/patients/api/patient-api'
import type { Patient } from '../../../features/patients/types/patient'

export default function QuickPatientModal({ onClose, onCreated }: { onClose: () => void; onCreated: (patient: Patient) => void }) {
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const pending = useRef(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (pending.current) return
    if (!fullName.trim() || !phone.trim()) {
      setError('Vui lòng nhập họ tên và số điện thoại.')
      return
    }
    pending.current = true; setSaving(true)
    setError('')
    try {
      const patient = await patientStaffApi.create({ fullName: fullName.trim(), phone: phone.replace(/\D/g, '') })
      onCreated(patient)
    } catch (value) {
      setError(displayError(value, 'Không thể tạo nhanh hồ sơ bệnh nhân.'))
    } finally {
      pending.current = false; setSaving(false)
    }
  }

  return <div className="fixed inset-0 z-[80] overflow-y-auto bg-slate-950/40 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="quick-patient-title"><div className="grid min-h-full place-items-center py-4"><div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl sm:p-8"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.15em] text-teal-700">Khách vãng lai</p><h2 id="quick-patient-title" className="mt-1 font-display text-2xl font-bold text-slate-900">Tạo nhanh hồ sơ</h2><p className="mt-2 text-sm text-slate-500">Chỉ cần hai thông tin bắt buộc. Sau khi xác nhận, bệnh nhân sẽ được chọn ngay trong lịch đặt.</p></div><button type="button" aria-label="Đóng" disabled={saving} onClick={onClose} className="grid size-9 shrink-0 place-items-center rounded-xl text-slate-400 hover:bg-slate-100"><X className="size-5" /></button></div>{error && <p role="alert" className="mt-5 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-700"><XCircle className="size-5" />{error}</p>}<form onSubmit={submit} className="mt-6"><fieldset disabled={saving} className="space-y-4"><label className="block"><span className="field-label"><UserRound className="size-4 text-teal-700" />Họ tên *</span><input autoFocus value={fullName} onChange={(event) => setFullName(event.target.value)} className="input-base" placeholder="Nguyễn Văn An" /></label><label className="block"><span className="field-label">Số điện thoại *</span><input type="tel" inputMode="numeric" value={phone} onChange={(event) => setPhone(event.target.value)} className="input-base" placeholder="0912345678" /></label><div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800"><CheckCircle2 className="size-4 shrink-0" />Hồ sơ này được tạo cho khách vãng lai và chưa có tài khoản đăng nhập.</div><div className="flex justify-end gap-3 pt-2"><Button type="button" variant="secondary" onClick={onClose}>Hủy</Button><Button type="submit" disabled={saving}>{saving ? 'Đang tạo...' : 'Xác nhận tạo hồ sơ'}</Button></div></fieldset></form></div></div></div>
}
