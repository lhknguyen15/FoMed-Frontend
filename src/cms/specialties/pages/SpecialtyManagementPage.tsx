import { useState } from 'react'
import { CheckCircle2, HeartPulse, PencilLine, Plus } from 'lucide-react'
import { Button, Card } from '../../../components/ui'
import { doctorAdminApi } from '../../../features/doctors/api/doctor-api'
import { useDoctorAdmin } from '../../../features/doctors/hooks/useDoctorAdmin'
import type { Specialty } from '../../../features/doctors/types/doctor'
import { useApiQuery } from '../../../shared/hooks/useApiQuery'
import { CMSEmpty, CMSError, CMSLoading } from '../../components/CMSDataTable'
import CMSPageHeader from '../../components/CMSPageHeader'
import CMSPagination from '../../components/CMSPagination'
import SpecialtyForm from '../components/SpecialtyForm'

const PAGE_SIZE = 10
export default function SpecialtyManagementPage() {
  const specialties = useApiQuery('admin-specialties', doctorAdminApi.specialties)
  const mutation = useDoctorAdmin()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Specialty | null>(null)
  const [success, setSuccess] = useState('')
  const [page, setPage] = useState(1)
  const openCreate = () => { mutation.clearError(); setEditing(null); setFormOpen(true) }
  const openEdit = (item: Specialty) => { mutation.clearError(); setEditing(item); setFormOpen(true) }
  const save = async (values: { name: string; description?: string; isActive?: boolean }) => {
    try {
      if (editing) await mutation.updateSpecialty(editing.specialtyId, { name: values.name, description: values.description, isActive: values.isActive ?? editing.isActive })
      else await mutation.createSpecialty(values)
      setFormOpen(false); setSuccess(editing ? 'Đã cập nhật chuyên khoa.' : 'Đã tạo chuyên khoa mới.'); specialties.refresh()
    } catch { /* lỗi hiển thị trong biểu mẫu */ }
  }
  const rows = specialties.data?.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE) ?? []
  return <>
    <CMSPageHeader title="Chuyên khoa" description="Quản lý danh mục chuyên khoa của phòng khám." action={<Button onClick={openCreate}><Plus className="size-4" />Thêm chuyên khoa</Button>} />
    {success && <div role="status" className="mb-5 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-700"><CheckCircle2 className="size-5" />{success}</div>}
    {specialties.loading ? <CMSLoading /> : specialties.error || !specialties.data ? <CMSError message={specialties.error} retry={specialties.refresh} /> : <Card className="overflow-hidden">{specialties.data.length === 0 ? <CMSEmpty label="chuyên khoa" /> : <><div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-3">{rows.map(item => <article key={item.specialtyId} className="rounded-2xl border border-slate-200 p-5"><div className="flex justify-between"><span className="grid size-10 place-items-center rounded-xl bg-teal-50 text-teal-700"><HeartPulse className="size-5" /></span><button onClick={() => openEdit(item)} aria-label={`Sửa ${item.name}`} className="grid size-9 place-items-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-teal-700"><PencilLine className="size-4" /></button></div><div className="mt-4 flex items-center justify-between gap-3"><h2 className="font-display font-bold">{item.name}</h2><span className={`rounded-full px-2 py-1 text-[11px] font-bold ${item.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{item.isActive ? 'Hoạt động' : 'Ngừng hoạt động'}</span></div><p className="mt-2 text-sm text-slate-500">{item.description || 'Chưa có mô tả.'}</p></article>)}</div><CMSPagination page={page} pageSize={PAGE_SIZE} totalItems={specialties.data.length} onPageChange={setPage} label="chuyên khoa" /></>}</Card>}
    {formOpen && <SpecialtyForm key={editing?.specialtyId ?? 'new'} specialty={editing} submitting={mutation.submitting} apiError={mutation.error} onCancel={() => setFormOpen(false)} onSubmit={save} />}
  </>
}
