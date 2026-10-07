import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { PackageCheck, RefreshCw, Search } from 'lucide-react'
import AppShell from '../../../components/AppShell'
import { Badge, Button, Card, EmptyState, PageTitle, SearchBox } from '../../../components/ui'
import { pharmacyApi } from '../../../features/pharmacy/api/pharmacy-api'
import { useApiQuery } from '../../../shared/hooks/useApiQuery'
import { formatDateTime } from '../../../shared/utils/format-date'

export default function PendingPrescriptionsPage() {
  const navigate = useNavigate()
  const [keyword, setKeyword] = useState('')
  const [status, setStatus] = useState('pending')
  const [applied, setApplied] = useState({ keyword: '', status: 'pending' })
  const [page, setPage] = useState(1)
  const [id, setId] = useState('')
  const [error, setError] = useState('')
  const query = useApiQuery(`pharmacy-list-${JSON.stringify(applied)}-${page}`, () => pharmacyApi.prescriptions(applied.keyword, applied.status, page))
  const pages = Math.max(1, Math.ceil((query.data?.total ?? 0) / 10))
  const lookup = () => {
    if (!/^\d+$/.test(id) || Number(id) < 1 || Number(id) > 2147483647) { setError('Vui lòng nhập mã đơn thuốc hợp lệ.'); return }
    navigate(`/pharmacy/dispense/${Number(id)}`)
  }
  return <AppShell>
    <PageTitle eyebrow="Nhà thuốc" title="Đơn thuốc" description="Chọn đơn đã chốt để kiểm tra lô thuốc ưu tiên hết hạn trước và xác nhận cấp phát." action={<Button variant="secondary" onClick={query.refresh}><RefreshCw className="size-4" />Làm mới</Button>} />
    <Card className="mb-5 p-4"><form className="flex flex-col gap-3 lg:flex-row" onSubmit={event => { event.preventDefault(); setApplied({ keyword: keyword.trim(), status }); setPage(1); query.refresh() }}>
      <SearchBox placeholder="Tìm tên bệnh nhân, mã BN hoặc mã đơn..." value={keyword} onChange={value => setKeyword(value.slice(0, 100))} />
      <select aria-label="Trạng thái cấp phát" className="input-base lg:max-w-56" value={status} onChange={event => setStatus(event.target.value)}><option value="pending">Chưa phát đủ</option><option value="dispensed">Đã phát đủ</option></select>
      <Button type="submit" disabled={query.loading}><Search className="size-4" />Lọc đơn</Button>
    </form><p className="mt-3 text-xs text-slate-500">Danh sách chỉ gồm đơn có thuốc, bệnh án đã chốt và lượt khám hoàn tất; trạng thái cấp phát không phụ thuộc thanh toán.</p></Card>
    <Card className="mb-5 p-4"><form onSubmit={event => { event.preventDefault(); lookup() }} className="flex flex-col gap-3 sm:flex-row sm:items-end"><label className="min-w-0 flex-1"><span className="field-label">Tra cứu trực tiếp mã đơn</span><input className="input-base" inputMode="numeric" maxLength={10} value={id} onChange={event => { setId(event.target.value); setError('') }} placeholder="Ví dụ: 332" /></label><Button variant="secondary" type="submit">Tra cứu đơn</Button></form>{error && <p role="alert" className="mt-3 text-sm text-rose-700">{error}</p>}</Card>
    <Card className="min-w-0 overflow-hidden">{query.loading ? <p role="status" className="p-8 text-center text-sm text-slate-500">Đang tải đơn thuốc...</p> : query.error ? <div className="p-8 text-center"><p role="alert" className="text-sm text-rose-700">{query.error}</p><Button className="mt-4" onClick={query.refresh}>Thử lại</Button></div> : <>
      {!query.data?.items.length ? <EmptyState icon={<PackageCheck className="size-6" />} title="Không có đơn phù hợp" body="Thử đổi bộ lọc hoặc làm mới sau khi bác sĩ chốt bệnh án." /> : <div className="overflow-x-auto"><table className="data-table"><thead><tr><th>Đơn thuốc</th><th>Bệnh nhân</th><th>Bác sĩ</th><th>Ngày kê</th><th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody>{query.data.items.map(item => <tr key={item.prescriptionId}><td><strong>#{item.prescriptionId}</strong><p className="mt-1 text-xs text-slate-400">Bệnh án #{item.medicalRecordId}</p></td><td><strong>{item.patientName}</strong><p className="mt-1 text-xs text-slate-500">{item.patientCode}</p></td><td>{item.doctorName}</td><td>{formatDateTime(item.createdAt)}</td><td><Badge tone={item.isFullyDispensed ? 'success' : 'warning'}>{item.isFullyDispensed ? 'Đã phát đủ' : 'Chưa phát đủ'}</Badge></td><td><Link to={`/pharmacy/dispense/${item.prescriptionId}`} className="inline-flex h-9 items-center rounded-xl border border-slate-200 px-3 text-xs font-semibold text-teal-700">{item.isFullyDispensed ? 'Xem đơn' : 'Kiểm tra & phát thuốc'}</Link></td></tr>)}</tbody></table></div>}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 p-4 text-xs text-slate-500"><span>{query.data?.total ?? 0} đơn · 10 / trang</span><div className="flex items-center gap-2"><Button variant="secondary" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Trước</Button><span>Trang {page} / {pages}</span><Button variant="secondary" disabled={page >= pages} onClick={() => setPage(p => p + 1)}>Sau</Button></div></div>
    </>}</Card>
  </AppShell>
}
