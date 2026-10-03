import { CalendarCheck, CircleDollarSign, Clock3, Stethoscope } from 'lucide-react'
import { Card } from '../../../components/ui'
import { reportApi } from '../../../features/reports/api/report-api'
import { useApiQuery } from '../../../shared/hooks/useApiQuery'
import { formatMoney } from '../../../shared/utils/format-money'
import { toDateInput } from '../../../shared/utils/format-date'
import { CMSError, CMSLoading } from '../../components/CMSDataTable'
import CMSPageHeader from '../../components/CMSPageHeader'

export default function AdminDashboardPage() {
  const today = toDateInput(new Date())
  const tomorrowDate = new Date()
  tomorrowDate.setDate(tomorrowDate.getDate() + 1)
  const tomorrow = toDateInput(tomorrowDate)
  const report = useApiQuery(`dashboard-${today}`, () => reportApi.summary({ from: today, to: tomorrow }))
  if (report.loading) return <><CMSPageHeader title="Tổng quan" description="Tình hình hoạt động của phòng khám hôm nay." /><CMSLoading /></>
  if (report.error || !report.data) return <><CMSPageHeader title="Tổng quan" description="Tình hình hoạt động của phòng khám hôm nay." /><CMSError message={report.error} retry={report.refresh} /></>
  const data = report.data
  const metrics = [
    ['Tổng lượt khám', data.totalAppointments.toLocaleString('vi-VN'), CalendarCheck, 'bg-teal-50 text-teal-700'],
    ['Đã hoàn thành', data.completedAppointments.toLocaleString('vi-VN'), Stethoscope, 'bg-sky-50 text-sky-700'],
    ['Doanh thu đã thu', formatMoney(data.collectedAmount), CircleDollarSign, 'bg-emerald-50 text-emerald-700'],
    ['Công nợ', formatMoney(data.outstandingAmount), Clock3, 'bg-amber-50 text-amber-700'],
  ] as const
  return <><CMSPageHeader title="Tổng quan" description="Tình hình hoạt động của phòng khám hôm nay." /><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{metrics.map(([label, value, Icon, tone]) => <Card key={label} className="p-5"><div className="flex items-start justify-between"><div><p className="text-sm font-medium text-slate-500">{label}</p><p className="mt-2 font-display text-2xl font-bold text-slate-900">{value}</p></div><span className={`grid size-11 place-items-center rounded-xl ${tone}`}><Icon className="size-5" /></span></div></Card>)}</div><Card className="mt-6 overflow-hidden"><div className="border-b border-slate-100 p-5"><h2 className="font-display font-bold">Hiệu suất theo bác sĩ</h2></div><div className="overflow-x-auto"><table className="data-table"><thead><tr><th>Bác sĩ</th><th>Lượt khám</th><th>Hoàn thành</th><th>Đã thu</th></tr></thead><tbody>{data.doctors.map((doctor) => <tr key={doctor.doctorId}><td className="font-semibold">{doctor.doctorName}</td><td>{doctor.appointmentCount}</td><td>{doctor.completedCount}</td><td>{formatMoney(doctor.collectedAmount)}</td></tr>)}</tbody></table></div></Card></>
}
