import { CalendarOff, Plus } from 'lucide-react'
import { Button, Card } from '../../../components/ui'
import { doctorAdminApi } from '../../../features/doctors/api/doctor-api'
import { scheduleAdminApi } from '../../../features/schedules/api/schedule-api'
import { useApiQuery } from '../../../shared/hooks/useApiQuery'
import { formatDateTime } from '../../../shared/utils/format-date'
import { CMSEmpty, CMSError, CMSLoading } from '../../components/CMSDataTable'
import CMSPageHeader from '../../components/CMSPageHeader'

export default function TimeOffManagementPage() {
  const timeOff = useApiQuery('admin-time-off', () => scheduleAdminApi.timeOff())
  const doctors = useApiQuery('admin-doctors-time-off', doctorAdminApi.list)
  const names = new Map(doctors.data?.map((doctor) => [doctor.doctorId, doctor.fullName]))
  return <><CMSPageHeader title="Lịch nghỉ" description="Theo dõi thời gian bác sĩ tạm ngưng nhận lịch khám." action={<Button><Plus className="size-4" /> Tạo lịch nghỉ</Button>} />{timeOff.loading ? <CMSLoading /> : timeOff.error || !timeOff.data ? <CMSError message={timeOff.error} retry={timeOff.refresh} /> : <Card className="overflow-hidden">{timeOff.data.length === 0 ? <CMSEmpty label="lịch nghỉ" /> : <div className="overflow-x-auto"><table className="data-table"><thead><tr><th>Bác sĩ</th><th>Bắt đầu</th><th>Kết thúc</th><th>Lý do</th></tr></thead><tbody>{timeOff.data.map((item) => <tr key={item.id}><td><span className="flex items-center gap-2"><CalendarOff className="size-4 text-amber-600" /><strong>{item.doctorId ? names.get(item.doctorId) || `Bác sĩ #${item.doctorId}` : 'Chưa xác định'}</strong></span></td><td>{formatDateTime(item.startAt)}</td><td>{formatDateTime(item.endAt)}</td><td>{item.reason || '—'}</td></tr>)}</tbody></table></div>}</Card>}</>
}
