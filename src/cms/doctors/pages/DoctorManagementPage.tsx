import { useState } from 'react'
import { CheckCircle2, PencilLine, Plus, Stethoscope } from 'lucide-react'
import { Button, Card } from '../../../components/ui'
import { doctorAdminApi } from '../../../features/doctors/api/doctor-api'
import { useDoctorAdmin } from '../../../features/doctors/hooks/useDoctorAdmin'
import type { DoctorFormValues } from '../../../features/doctors/schemas/doctor-schema'
import type { Doctor } from '../../../features/doctors/types/doctor'
import { useApiQuery } from '../../../shared/hooks/useApiQuery'
import { formatMoney } from '../../../shared/utils/format-money'
import { CMSEmpty, CMSError, CMSLoading, CMSStatusBadge } from '../../components/CMSDataTable'
import CMSPageHeader from '../../components/CMSPageHeader'
import CMSPagination from '../../components/CMSPagination'
import DoctorAdminForm from '../components/DoctorAdminForm'

const PAGE_SIZE = 10

export default function DoctorManagementPage() {
  const doctors = useApiQuery('admin-doctors', doctorAdminApi.list)
  const specialties = useApiQuery('admin-specialties-for-doctor', doctorAdminApi.specialties)
  const mutation = useDoctorAdmin()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Doctor | null>(null)
  const [success, setSuccess] = useState('')
  const [page, setPage] = useState(1)
  const openCreate = () => { mutation.clearError(); setEditing(null); setFormOpen(true) }
  const openEdit = (doctor: Doctor) => { mutation.clearError(); setEditing(doctor); setFormOpen(true) }
  const save = async (values: DoctorFormValues) => {
    const common = { fullName: values.fullName.trim(), specialtyId: Number(values.specialtyId), title: values.title.trim() || undefined, licenseNumber: values.licenseNumber.trim() || undefined, phone: values.phone.replace(/\s/g, '') || undefined, room: values.room.trim() || undefined, consultationFee: Number(values.consultationFee) }
    try {
      if (editing) await mutation.updateDoctor(editing.doctorId, { ...common, isActive: values.isActive })
      else await mutation.createDoctor({ ...common, username: values.username.trim(), password: values.password, email: values.email.trim() || undefined })
      setFormOpen(false); setSuccess(editing ? 'Đã cập nhật hồ sơ bác sĩ.' : 'Đã tạo tài khoản và hồ sơ bác sĩ.'); doctors.refresh()
    } catch { /* lỗi API được hiển thị trong biểu mẫu */ }
  }
  const rows = doctors.data?.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE) ?? []
  return <>
    <CMSPageHeader title="Bác sĩ" description="Quản lý hồ sơ hành nghề và chuyên khoa phụ trách." action={<Button onClick={openCreate} disabled={!specialties.data?.some(item => item.isActive)}><Plus className="size-4" />Thêm bác sĩ</Button>} />
    {success && <div role="status" className="mb-5 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-700"><CheckCircle2 className="size-5" />{success}</div>}
    {doctors.loading ? <CMSLoading /> : doctors.error || !doctors.data ? <CMSError message={doctors.error} retry={doctors.refresh} /> : <Card className="overflow-hidden">{doctors.data.length === 0 ? <CMSEmpty label="bác sĩ" /> : <><div className="overflow-x-auto"><table className="data-table"><thead><tr><th>Bác sĩ</th><th>Chuyên khoa</th><th>Chứng chỉ</th><th>Phòng</th><th>Phí khám</th><th>Trạng thái</th><th /></tr></thead><tbody>{rows.map(doctor => <tr key={doctor.doctorId}><td><span className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-xl bg-teal-50 text-teal-700"><Stethoscope className="size-4" /></span><span><strong className="block">{doctor.title ? `${doctor.title} ` : ''}{doctor.fullName}</strong><small>{doctor.phone || 'Chưa có SĐT'}</small></span></span></td><td>{doctor.specialtyName}</td><td>{doctor.licenseNumber || '—'}</td><td>{doctor.room || '—'}</td><td>{formatMoney(doctor.consultationFee)}</td><td><CMSStatusBadge active={doctor.isActive} /></td><td><button onClick={() => openEdit(doctor)} aria-label={`Sửa ${doctor.fullName}`} className="grid size-9 place-items-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-teal-700"><PencilLine className="size-4" /></button></td></tr>)}</tbody></table></div><CMSPagination page={page} pageSize={PAGE_SIZE} totalItems={doctors.data.length} onPageChange={setPage} label="bác sĩ" /></>}</Card>}
    {formOpen && specialties.data && <DoctorAdminForm key={editing?.doctorId ?? 'new'} doctor={editing} specialties={specialties.data} submitting={mutation.submitting} apiError={mutation.error} onCancel={() => setFormOpen(false)} onSubmit={save} />}
  </>
}
