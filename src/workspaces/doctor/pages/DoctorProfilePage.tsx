import { displayError } from '../../../shared/api/user-messages'
import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { AlertCircle, CheckCircle2, ExternalLink } from 'lucide-react'
import { Button, Card } from '../../../components/ui'
import { doctorProfileApi } from '../../../features/doctors/api/doctor-api'
import DoctorForm from '../../../features/doctors/components/DoctorForm'
import DoctorAvatar from '../../../features/doctors/components/DoctorAvatar'
import { validateDoctorPublicProfile, type DoctorPublicProfileValues } from '../../../features/doctors/schemas/doctor-schema'
import type { Doctor } from '../../../features/doctors/types/doctor'

export default function DoctorProfilePage() {
  const [doctor, setDoctor] = useState<Doctor | null>(null)
  const [values, setValues] = useState<DoctorPublicProfileValues>({ avatarUrl: '', biography: '', practiceStartYear: '' })
  const [room, setRoom] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [errors, setErrors] = useState<Partial<Record<keyof DoctorPublicProfileValues, string>>>({})

  const applyDoctor = (data: Doctor) => {
    setDoctor(data)
    setValues({ avatarUrl: data.avatarUrl ?? '', biography: data.biography ?? '', practiceStartYear: data.practiceStartYear == null ? '' : String(data.practiceStartYear) })
    setRoom(data.room ?? '')
  }

  useEffect(() => {
    let active = true
    void doctorProfileApi.me().then((data) => { if (active) applyDoctor(data) })
      .catch((reason: unknown) => { if (active) setError(displayError(reason, 'Không thể tải hồ sơ bác sĩ.')) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!doctor) return
    setError(''); setSuccess('')
    const validation = validateDoctorPublicProfile(values)
    setErrors(validation)
    if (Object.keys(validation).length) return
    setSaving(true)
    try {
      const updated = await doctorProfileApi.update({
        fullName: doctor.fullName, specialtyId: doctor.specialtyId, title: doctor.title ?? undefined,
        phone: doctor.phone ?? undefined, licenseNumber: doctor.licenseNumber ?? undefined,
        consultationFee: doctor.consultationFee, room: room.trim() || undefined,
        avatarUrl: values.avatarUrl.trim() || null, biography: values.biography.trim() || null,
        practiceStartYear: values.practiceStartYear ? Number(values.practiceStartYear) : null,
      })
      applyDoctor(updated)
      setSuccess('Đã cập nhật hồ sơ bác sĩ công khai.')
    } catch (reason) { setError(displayError(reason, 'Không thể lưu hồ sơ bác sĩ.')) }
    finally { setSaving(false) }
  }

  if (loading) return <Card className="grid min-h-64 place-items-center text-sm text-slate-500">Đang tải hồ sơ bác sĩ...</Card>
  return <>
    {error && <div role="alert" className="mb-4 flex gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700"><AlertCircle className="size-5 shrink-0" />{error}</div>}
    {success && <div role="status" className="mb-4 flex gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700"><CheckCircle2 className="size-5 shrink-0" />{success}</div>}
    {doctor && <Card className="overflow-hidden">
      <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:p-6"><div className="flex items-center gap-3"><DoctorAvatar name={doctor.fullName} url={values.avatarUrl.trim()} className="size-14 text-lg" /><div><h2 className="font-display text-lg font-bold text-slate-900">{doctor.title ? `${doctor.title} ` : ''}{doctor.fullName}</h2><p className="mt-1 text-sm text-slate-500">{doctor.specialtyName}</p></div></div><Link to={`/doctors/${doctor.doctorId}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-bold text-teal-700 hover:text-teal-900">Xem hồ sơ công khai <ExternalLink className="size-4" /></Link></div>
      <form onSubmit={(event) => void submit(event)} className="space-y-5 p-5 sm:p-6">
        <DoctorForm values={values} errors={errors} disabled={saving} onChange={(key, value) => { setValues((current) => ({ ...current, [key]: value })); setErrors((current) => ({ ...current, [key]: undefined })) }} />
        <label className="block"><span className="field-label">Phòng khám</span><input disabled={saving} value={room} onChange={(event) => setRoom(event.target.value)} maxLength={50} className="input-base" /><span className="mt-1 block text-xs text-slate-500">Thông tin này được hiển thị cho bệnh nhân khi xem hồ sơ bác sĩ.</span></label>
        <div className="flex justify-end border-t border-slate-100 pt-4"><Button disabled={saving} type="submit">{saving ? 'Đang lưu...' : 'Lưu hồ sơ'}</Button></div>
      </form>
    </Card>}
  </>
}
