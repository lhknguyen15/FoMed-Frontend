import { useState } from 'react'
import { CalendarRange, CircleDollarSign, WalletCards } from 'lucide-react'
import { Card } from '../../../components/ui'
import { reportApi } from '../../../features/reports/api/report-api'
import { useApiQuery } from '../../../shared/hooks/useApiQuery'
import { formatMoney } from '../../../shared/utils/format-money'
import { toDateInput } from '../../../shared/utils/format-date'
import { CMSEmpty, CMSError, CMSLoading } from '../../components/CMSDataTable'
import CMSPageHeader from '../../components/CMSPageHeader'

export default function AdminReportPage() {
  const now = new Date()
  const [from, setFrom] = useState(toDateInput(new Date(now.getFullYear(), now.getMonth(), 1)))
  const [to, setTo] = useState(toDateInput(now))
  const report = useApiQuery(`report-${from}-${to}`, () => reportApi.summary({ from, to }))
  return <><CMSPageHeader title="Báo cáo vận hành" description="Tổng hợp lượt khám, doanh thu và hiệu suất theo bác sĩ." action={<div className="flex gap-2"><input aria-label="Từ ngày" type="date" value={from} onChange={(event) => setFrom(event.target.value)} className="input-base" /><input aria-label="Đến ngày" type="date" value={to} onChange={(event) => setTo(event.target.value)} className="input-base" /></div>} />{report.loading ? <CMSLoading /> : report.error || !report.data ? <CMSError message={report.error} retry={report.refresh} /> : <><div className="grid gap-4 sm:grid-cols-3"><Card className="p-5"><CalendarRange className="size-5 text-teal-700" /><p className="mt-3 text-sm text-slate-500">Tổng lượt khám</p><b className="text-2xl">{report.data.totalAppointments}</b></Card><Card className="p-5"><CircleDollarSign className="size-5 text-sky-700" /><p className="mt-3 text-sm text-slate-500">Tổng lập hóa đơn</p><b className="text-2xl">{formatMoney(report.data.invoicedAmount)}</b></Card><Card className="p-5"><WalletCards className="size-5 text-emerald-700" /><p className="mt-3 text-sm text-slate-500">Đã thu</p><b className="text-2xl">{formatMoney(report.data.collectedAmount)}</b></Card></div><Card className="mt-6 overflow-hidden">{report.data.doctors.length === 0 ? <CMSEmpty label="dữ liệu trong kỳ" /> : <div className="overflow-x-auto"><table className="data-table"><thead><tr><th>Bác sĩ</th><th>Lượt khám</th><th>Hoàn thành</th><th>Không đến</th><th>Đã thu</th></tr></thead><tbody>{report.data.doctors.map((row) => <tr key={row.doctorId}><td className="font-semibold">{row.doctorName}</td><td>{row.appointmentCount}</td><td>{row.completedCount}</td><td>{row.noShowCount}</td><td>{formatMoney(row.collectedAmount)}</td></tr>)}</tbody></table></div>}</Card></>}</>
}
