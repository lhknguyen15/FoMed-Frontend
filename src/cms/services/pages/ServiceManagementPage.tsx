import { useState } from 'react'
import { Activity, CheckCircle2, PencilLine, Plus } from 'lucide-react'
import { Button, Card } from '../../../components/ui'
import { serviceAdminApi } from '../../../features/billing/api/billing-api'
import { useServiceAdmin } from '../../../features/billing/hooks/useServiceAdmin'
import type { ServiceFormValues } from '../../../features/billing/schemas/service-schema'
import type { MedicalService } from '../../../features/billing/types/billing'
import { doctorAdminApi } from '../../../features/doctors/api/doctor-api'
import { useApiQuery } from '../../../shared/hooks/useApiQuery'
import { formatMoney } from '../../../shared/utils/format-money'
import { CMSEmpty, CMSError, CMSLoading, CMSStatusBadge } from '../../components/CMSDataTable'
import CMSPageHeader from '../../components/CMSPageHeader'
import CMSPagination from '../../components/CMSPagination'
import ServiceForm from '../components/ServiceForm'

const PAGE_SIZE = 10
export default function ServiceManagementPage() {
  const services = useApiQuery('admin-services', serviceAdminApi.list)
  const specialties = useApiQuery('admin-specialties-for-services', doctorAdminApi.specialties)
  const mutation = useServiceAdmin()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<MedicalService | null>(null)
  const [success, setSuccess] = useState('')
  const [page, setPage] = useState(1)
  const openCreate = () => { mutation.clearError(); setEditing(null); setSuccess(''); setFormOpen(true) }
  const openEdit = (service: MedicalService) => { mutation.clearError(); setEditing(service); setSuccess(''); setFormOpen(true) }
  const save = async (values: ServiceFormValues) => {
    const common = { code: values.code.trim() || undefined, name: values.name.trim(), description: values.description.trim() || undefined, price: Number(values.price), specialtyId: values.specialtyId ? Number(values.specialtyId) : undefined, durationMinutes: Number(values.durationMinutes) }
    try {
      if (editing) await mutation.updateService(editing.serviceId, { ...common, isActive: values.isActive })
      else await mutation.createService(common)
      setFormOpen(false); setSuccess(editing ? 'Đã cập nhật dịch vụ.' : 'Đã tạo dịch vụ mới.'); services.refresh()
    } catch { /* lỗi API hiển thị trong biểu mẫu */ }
  }
  const rows = services.data?.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE) ?? []
  return <>
    <CMSPageHeader title="Danh mục dịch vụ" description="Quản lý dịch vụ khám, cận lâm sàng, đơn giá và thời lượng." action={<Button onClick={openCreate} disabled={specialties.loading}><Plus className="size-4" />Thêm dịch vụ</Button>} />
    {success && <div role="status" className="mb-5 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-700"><CheckCircle2 className="size-5" />{success}</div>}
    {services.loading ? <CMSLoading /> : services.error || !services.data ? <CMSError message={services.error} retry={services.refresh} /> : <Card className="overflow-hidden">{services.data.length === 0 ? <CMSEmpty label="dịch vụ" /> : <><div className="overflow-x-auto"><table className="data-table"><thead><tr><th>Mã</th><th>Dịch vụ</th><th>Chuyên khoa</th><th>Đơn giá</th><th>Thời lượng</th><th>Trạng thái</th><th /></tr></thead><tbody>{rows.map(service => <tr key={service.serviceId}><td className="font-bold text-teal-700">{service.code || `DV${service.serviceId}`}</td><td><span className="flex items-center gap-2"><Activity className="size-4 text-teal-700" /><span><strong className="block">{service.name}</strong>{service.description && <small>{service.description}</small>}</span></span></td><td>{service.specialtyName || 'Dùng chung'}</td><td>{formatMoney(service.price)}</td><td>{service.durationMinutes} phút</td><td><CMSStatusBadge active={service.isActive} /></td><td><button onClick={() => openEdit(service)} aria-label={`Sửa ${service.name}`} className="grid size-9 place-items-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-teal-700"><PencilLine className="size-4" /></button></td></tr>)}</tbody></table></div><CMSPagination page={page} pageSize={PAGE_SIZE} totalItems={services.data.length} onPageChange={setPage} label="dịch vụ" /></>}</Card>}
    {formOpen && specialties.data && <ServiceForm key={editing?.serviceId ?? 'new'} service={editing} specialties={specialties.data} submitting={mutation.submitting} apiError={mutation.error} onCancel={() => setFormOpen(false)} onSubmit={save} />}
  </>
}
