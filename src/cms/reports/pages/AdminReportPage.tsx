import { useState } from 'react'
import { BarChart3, CalendarRange, CheckCircle2, CircleDollarSign, Download, Users, WalletCards, XCircle } from 'lucide-react'
import { Button, Card } from '../../../components/ui'
import { doctorAdminApi } from '../../../features/doctors/api/doctor-api'
import { reportApi } from '../../../features/reports/api/report-api'
import { useApiQuery } from '../../../shared/hooks/useApiQuery'
import { formatMoney } from '../../../shared/utils/format-money'
import { toDateInput } from '../../../shared/utils/format-date'
import { CMSEmpty, CMSError, CMSLoading } from '../../components/CMSDataTable'
import CMSPageHeader from '../../components/CMSPageHeader'

function exclusiveEnd(value: string) {
  if (!value) return value
  const date = new Date(`${value}T00:00:00`)
  date.setDate(date.getDate() + 1)
  return toDateInput(date)
}

function calculateNoShowRate(noShowCount: number, appointmentCount: number, cancelledCount: number) {
  const eligibleCount = Math.max(0, appointmentCount - cancelledCount)
  return eligibleCount === 0 ? 0 : Math.round((noShowCount / eligibleCount) * 1000) / 10
}

export default function AdminReportPage() {
  const now = new Date()
  const initialFrom = toDateInput(new Date(now.getFullYear(), now.getMonth(), 1))
  const initialTo = toDateInput(now)
  const [from, setFrom] = useState(initialFrom)
  const [to, setTo] = useState(initialTo)
  const [doctorId, setDoctorId] = useState('')
  const [applied, setApplied] = useState({ from: initialFrom, to: initialTo, doctorId: '' })
  const [formError, setFormError] = useState('')
  const [downloadError, setDownloadError] = useState('')
  const [downloading, setDownloading] = useState(false)
  const doctors = useApiQuery('admin-report-doctors', doctorAdminApi.list)
  const invalidRange = Boolean(from && to && from > to)
  const report = useApiQuery(`report-${applied.from}-${applied.to}-${applied.doctorId}`, () => reportApi.summary({ from: applied.from, to: exclusiveEnd(applied.to), doctorId: applied.doctorId ? Number(applied.doctorId) : undefined }))
  const apply = () => {
    if (invalidRange || !from || !to) { setFormError('Vui lòng chọn khoảng ngày hợp lệ. Ngày bắt đầu không được sau ngày kết thúc.'); return }
    setFormError(''); setDownloadError(''); setApplied({ from, to, doctorId })
  }
  const exportReport = async () => {
    setDownloading(true); setDownloadError('')
    try {
      const result = await reportApi.exportCsv({ from: applied.from, to: exclusiveEnd(applied.to), doctorId: applied.doctorId ? Number(applied.doctorId) : undefined })
      const url = URL.createObjectURL(result.blob)
      const anchor = document.createElement('a')
      anchor.href = url; anchor.download = result.fileName || `fomed-report-${applied.from}-${applied.to}.csv`; anchor.click()
      URL.revokeObjectURL(url)
    } catch (reason) { setDownloadError(reason instanceof Error ? reason.message : 'Không thể xuất báo cáo.') }
    finally { setDownloading(false) }
  }
  const data = report.data
  // Keep the report usable against an API process that has not yet been restarted with the new DTO.
  const noShowRatePercent = data?.noShowRatePercent ?? (data ? calculateNoShowRate(data.noShowAppointments, data.totalAppointments, data.cancelledAppointments) : 0)
  const metrics = data ? [
    { label: 'Tổng lượt khám', value: data.totalAppointments.toLocaleString('vi-VN'), icon: CalendarRange, tone: 'text-teal-700' },
    { label: 'Đã hoàn thành', value: data.completedAppointments.toLocaleString('vi-VN'), icon: CheckCircle2, tone: 'text-emerald-700' },
    { label: 'Đã hủy', value: data.cancelledAppointments.toLocaleString('vi-VN'), icon: XCircle, tone: 'text-rose-700' },
    { label: `Tỷ lệ không đến · ${data.noShowAppointments} lượt`, value: `${noShowRatePercent.toLocaleString('vi-VN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`, icon: Users, tone: 'text-amber-700' },
    { label: 'Giá trị hóa đơn phát hành', value: formatMoney(data.invoicedAmount), icon: CircleDollarSign, tone: 'text-sky-700' },
    { label: 'Doanh thu thực thu', value: formatMoney(data.collectedAmount), icon: WalletCards, tone: 'text-emerald-700' },
    { label: 'Còn phải thu', value: formatMoney(data.outstandingAmount), icon: CircleDollarSign, tone: 'text-orange-700' },
  ] : []

  return <>
    <CMSPageHeader title="Báo cáo vận hành" description="Theo dõi lượt khám, trạng thái lịch hẹn và tình hình thu phí theo khoảng thời gian, bác sĩ." action={<Button variant="secondary" onClick={() => void exportReport()} disabled={!data || downloading}><Download className="size-4" />{downloading ? 'Đang xuất…' : 'Xuất CSV'}</Button>} />
    <Card className="mb-6 p-4"><div className="grid items-end gap-3 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_1.25fr_auto]"><label className="block"><span className="mb-1.5 block text-xs font-semibold text-slate-500">Từ ngày</span><input type="date" value={from} onChange={e => setFrom(e.target.value)} className="input-base" /></label><label className="block"><span className="mb-1.5 block text-xs font-semibold text-slate-500">Đến ngày</span><input type="date" value={to} onChange={e => setTo(e.target.value)} className="input-base" /></label><label className="block"><span className="mb-1.5 block text-xs font-semibold text-slate-500">Bác sĩ</span><select value={doctorId} onChange={e => setDoctorId(e.target.value)} className="input-base"><option value="">Tất cả bác sĩ</option>{doctors.data?.filter(d => d.isActive).map(d => <option key={d.doctorId} value={d.doctorId}>{d.title ? `${d.title} ` : ''}{d.fullName}</option>)}</select></label><Button onClick={apply} disabled={invalidRange}><BarChart3 className="size-4" />Lọc báo cáo</Button></div>{(formError || downloadError) && <p role="alert" className="mt-3 text-sm font-semibold text-rose-600">{formError || downloadError}</p>}</Card>
    {report.loading ? <CMSLoading /> : report.error || !data ? <CMSError message={report.error} retry={report.refresh} /> : <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{metrics.map(({ label, value, icon: Icon, tone }) => <Card key={label} className="p-5"><Icon className={`size-5 ${tone}`} /><p className="mt-3 text-sm text-slate-500">{label}</p><b className="mt-1 block text-xl text-slate-900">{value}</b></Card>)}</div>
      <Card className="mt-6 overflow-hidden"><div className="border-b border-slate-100 p-5"><h2 className="font-display font-bold">Thống kê theo bác sĩ</h2><p className="mt-1 text-sm text-slate-500">{applied.from} – {applied.to}</p></div>{data.doctors.length === 0 ? <CMSEmpty label="dữ liệu bác sĩ trong kỳ" /> : <div className="overflow-x-auto"><table className="data-table"><thead><tr><th>Bác sĩ</th><th>Lượt khám</th><th>Hoàn thành</th><th>Không đến (%)</th><th>Hóa đơn phát hành</th><th>Doanh thu thực thu</th><th>Công nợ</th></tr></thead><tbody>{data.doctors.map(row => <tr key={row.doctorId}><td className="font-semibold">{row.doctorName}</td><td>{row.appointmentCount}</td><td>{row.completedCount}</td><td>{row.noShowCount} ({(row.noShowRatePercent ?? calculateNoShowRate(row.noShowCount, row.appointmentCount, row.cancelledCount ?? 0)).toLocaleString('vi-VN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%)</td><td>{formatMoney(row.invoicedAmount)}</td><td>{formatMoney(row.collectedAmount)}</td><td>{formatMoney(row.outstandingAmount ?? 0)}</td></tr>)}</tbody></table></div>}</Card>
    </>}
  </>
}
