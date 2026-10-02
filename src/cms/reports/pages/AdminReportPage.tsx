import { useState } from 'react'
import { CalendarRange, CheckCircle2, CircleDollarSign, Download, Users, WalletCards } from 'lucide-react'
import { Button, Card } from '../../../components/ui'
import { doctorAdminApi } from '../../../features/doctors/api/doctor-api'
import { reportApi } from '../../../features/reports/api/report-api'
import { useApiQuery } from '../../../shared/hooks/useApiQuery'
import { formatMoney } from '../../../shared/utils/format-money'
import { toDateInput } from '../../../shared/utils/format-date'
import { CMSEmpty, CMSError, CMSLoading } from '../../components/CMSDataTable'
import CMSPageHeader from '../../components/CMSPageHeader'

function nextDate(value: string) {
  if (!value) return value
  const date = new Date(`${value}T00:00:00`)
  date.setDate(date.getDate() + 1)
  return toDateInput(date)
}

export default function AdminReportPage() {
  const now = new Date()
  const [from, setFrom] = useState(toDateInput(new Date(now.getFullYear(), now.getMonth(), 1)))
  const [to, setTo] = useState(toDateInput(now))
  const [doctorId, setDoctorId] = useState('')
  const [downloadError, setDownloadError] = useState('')
  const [downloading, setDownloading] = useState(false)
  const doctors = useApiQuery('admin-report-doctors', doctorAdminApi.list)
  const invalidRange = Boolean(from && to && from > to)
  const report = useApiQuery(`report-${from}-${to}-${doctorId}`, () => invalidRange ? Promise.reject(new Error('Ngày bắt đầu phải trước hoặc bằng ngày kết thúc.')) : reportApi.summary({ from, to: nextDate(to), doctorId: doctorId ? Number(doctorId) : undefined }))

  const exportReport = async () => {
    if (invalidRange) { setDownloadError('Ngày bắt đầu phải trước hoặc bằng ngày kết thúc.'); return }
    setDownloading(true)
    setDownloadError('')
    try {
      const result = await reportApi.exportCsv({ from, to: nextDate(to), doctorId: doctorId ? Number(doctorId) : undefined })
      const url = URL.createObjectURL(result.blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = result.fileName || `fomed-report-${from}-${to}.csv`
      anchor.click()
      URL.revokeObjectURL(url)
    } catch (reason) {
      setDownloadError(reason instanceof Error ? reason.message : 'Không thể xuất báo cáo.')
    } finally { setDownloading(false) }
  }

  return <><CMSPageHeader title="Báo cáo vận hành" description="Tổng hợp lượt khám, doanh thu và hiệu suất theo bác sĩ." />
    <Card className="mb-6 p-4"><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5"><label className="block"><span className="mb-1.5 block text-xs font-semibold text-slate-500">Từ ngày</span><input type="date" value={from} onChange={(event) => setFrom(event.target.value)} className="input-base" /></label><label className="block"><span className="mb-1.5 block text-xs font-semibold text-slate-500">Đến ngày</span><input type="date" value={to} onChange={(event) => setTo(event.target.value)} className="input-base" /></label><label className="block sm:col-span-2 xl:col-span-1"><span className="mb-1.5 block text-xs font-semibold text-slate-500">Bác sĩ</span><select value={doctorId} onChange={(event) => setDoctorId(event.target.value)} className="input-base"><option value="">Tất cả bác sĩ</option>{doctors.data?.filter((doctor) => doctor.isActive).map((doctor) => <option key={doctor.doctorId} value={doctor.doctorId}>{doctor.title ? `${doctor.title} ` : ''}{doctor.fullName}</option>)}</select></label><div className="flex items-end xl:col-span-2"><Button className="w-full sm:w-auto" onClick={() => void exportReport()} disabled={downloading || invalidRange}><Download className="size-4" />{downloading ? 'Đang xuất...' : 'Xuất CSV'}</Button></div></div>{(invalidRange || downloadError) && <p role="alert" className="mt-3 text-sm font-semibold text-rose-600">{downloadError || 'Ngày bắt đầu phải trước hoặc bằng ngày kết thúc.'}</p>}</Card>
    {report.loading ? <CMSLoading /> : report.error || !report.data ? <CMSError message={report.error} retry={report.refresh} /> : <><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6"><Card className="p-5"><CalendarRange className="size-5 text-teal-700" /><p className="mt-3 text-sm text-slate-500">Tổng lượt khám</p><b className="text-2xl">{report.data.totalAppointments.toLocaleString('vi-VN')}</b></Card><Card className="p-5"><CheckCircle2 className="size-5 text-sky-700" /><p className="mt-3 text-sm text-slate-500">Đã hoàn thành</p><b className="text-2xl">{report.data.completedAppointments.toLocaleString('vi-VN')}</b></Card><Card className="p-5"><Users className="size-5 text-amber-700" /><p className="mt-3 text-sm text-slate-500">Không đến</p><b className="text-2xl">{report.data.noShowAppointments.toLocaleString('vi-VN')}</b></Card><Card className="p-5"><CircleDollarSign className="size-5 text-sky-700" /><p className="mt-3 text-sm text-slate-500">Tổng lập hóa đơn</p><b className="text-xl">{formatMoney(report.data.invoicedAmount)}</b></Card><Card className="p-5"><WalletCards className="size-5 text-emerald-700" /><p className="mt-3 text-sm text-slate-500">Đã thu</p><b className="text-xl">{formatMoney(report.data.collectedAmount)}</b></Card><Card className="p-5"><CircleDollarSign className="size-5 text-rose-700" /><p className="mt-3 text-sm text-slate-500">Còn công nợ</p><b className="text-xl">{formatMoney(report.data.outstandingAmount)}</b></Card></div><Card className="mt-6 overflow-hidden">{report.data.doctors.length === 0 ? <CMSEmpty label="dữ liệu trong kỳ" /> : <div className="overflow-x-auto"><table className="data-table"><thead><tr><th>Bác sĩ</th><th>Lượt khám</th><th>Hoàn thành</th><th>Không đến</th><th>Lập hóa đơn</th><th>Đã thu</th></tr></thead><tbody>{report.data.doctors.map((row) => <tr key={row.doctorId}><td className="font-semibold">{row.doctorName}</td><td>{row.appointmentCount}</td><td>{row.completedCount}</td><td>{row.noShowCount}</td><td>{formatMoney(row.invoicedAmount)}</td><td>{formatMoney(row.collectedAmount)}</td></tr>)}</tbody></table></div>}</Card></>}
  </>
}
