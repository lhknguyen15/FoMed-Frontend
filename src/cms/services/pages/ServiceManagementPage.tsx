import { Activity, Plus } from 'lucide-react'
import { Button, Card } from '../../../components/ui'
import { serviceAdminApi } from '../../../features/billing/api/billing-api'
import { useApiQuery } from '../../../shared/hooks/useApiQuery'
import { formatMoney } from '../../../shared/utils/format-money'
import { CMSEmpty, CMSError, CMSLoading, CMSStatusBadge } from '../../components/CMSDataTable'
import CMSPageHeader from '../../components/CMSPageHeader'

export default function ServiceManagementPage() {
  const services = useApiQuery('admin-services', serviceAdminApi.list)
  return <><CMSPageHeader title="Danh mục dịch vụ" description="Quản lý dịch vụ khám, cận lâm sàng, đơn giá và thời lượng." action={<Button><Plus className="size-4" /> Thêm dịch vụ</Button>} />{services.loading ? <CMSLoading /> : services.error || !services.data ? <CMSError message={services.error} retry={services.refresh} /> : <Card className="overflow-hidden">{services.data.length === 0 ? <CMSEmpty label="dịch vụ" /> : <div className="overflow-x-auto"><table className="data-table"><thead><tr><th>Mã</th><th>Dịch vụ</th><th>Chuyên khoa</th><th>Đơn giá</th><th>Thời lượng</th><th>Trạng thái</th></tr></thead><tbody>{services.data.map((service) => <tr key={service.serviceId}><td className="font-bold text-teal-700">{service.code || `DV${service.serviceId}`}</td><td><span className="flex items-center gap-2"><Activity className="size-4 text-teal-700" /><strong>{service.name}</strong></span></td><td>{service.specialtyName || 'Dùng chung'}</td><td>{formatMoney(service.price)}</td><td>{service.durationMinutes} phút</td><td><CMSStatusBadge active={service.isActive} /></td></tr>)}</tbody></table></div>}</Card>}</>
}
