import { ArrowLeft, ClipboardList, Paperclip, RefreshCw, Search } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import AppShell from '../../../components/AppShell'
import { Badge, Button, Card, EmptyState, PageTitle, SearchBox } from '../../../components/ui'
import AttachmentPanel from '../../../features/clinical/components/AttachmentPanel'
import { clinicalApi } from '../../../features/clinical/api/clinical-api'
import type { ServiceOrder } from '../../../features/clinical/types/clinical'
import { useApiQuery } from '../../../shared/hooks/useApiQuery'
import { formatDateTime } from '../../../shared/utils/format-date'

export default function TechnicianResultsPage() {
  const [keyword, setKeyword] = useState('')
  const [applied, setApplied] = useState('')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<ServiceOrder | null>(null)
  const query = useApiQuery(`lab-results-${applied}-${page}`, () => clinicalApi.labResults(applied, page))
  const pages = Math.max(1, Math.ceil((query.data?.total ?? 0) / 10))
  return <AppShell>
    <PageTitle eyebrow="Cận lâm sàng" title="Lịch sử kết quả" description="Tra cứu các kết quả bạn đã lưu và trả về bệnh án." action={<div className="flex flex-wrap gap-2"><Link to="/technician/orders" className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700"><ArrowLeft className="size-4" />Chỉ định chờ</Link><Button variant="secondary" onClick={query.refresh}><RefreshCw className="size-4" />Làm mới</Button></div>} />
    <Card className="mb-5 p-4"><form onSubmit={event => { event.preventDefault(); setApplied(keyword.trim()); setPage(1); setSelected(null); query.refresh() }} className="flex flex-col gap-3 sm:flex-row"><SearchBox placeholder="Tìm dịch vụ, tên bệnh nhân hoặc mã BN..." value={keyword} onChange={value => setKeyword(value.slice(0, 100))} /><Button type="submit" disabled={query.loading}><Search className="size-4" />Lọc kết quả</Button></form></Card>
    <Card className="mb-5 min-w-0 overflow-hidden">{query.loading ? <p role="status" className="p-8 text-center text-sm text-slate-500">Đang tải kết quả...</p> : query.error ? <div className="p-8 text-center"><p role="alert" className="text-sm text-rose-700">{query.error}</p><Button onClick={query.refresh} className="mt-4">Thử lại</Button></div> : <>
      {!query.data?.items.length ? <EmptyState icon={<ClipboardList className="size-6" />} title="Chưa có kết quả phù hợp" body="Kết quả đã lưu bằng tài khoản này sẽ xuất hiện tại đây." /> : <div className="overflow-x-auto"><table className="data-table"><thead><tr><th>Dịch vụ</th><th>Bệnh nhân</th><th>Kết quả</th><th>Khoảng tham chiếu</th><th>Thời điểm</th><th>Trạng thái</th><th>File</th></tr></thead><tbody>{query.data.items.map(({ order, patientName, patientCode }) => <tr key={order.id}><td><strong>{order.serviceName}</strong><p className="mt-1 text-xs text-slate-500">Bệnh án #{order.medicalRecordId}</p></td><td><strong>{patientName}</strong><p className="mt-1 text-xs text-slate-500">{patientCode}</p></td><td><p className="max-w-xs whitespace-normal">{order.resultSummary || '—'}</p>{order.conclusion && <p className="mt-1 max-w-xs whitespace-normal text-xs text-slate-500">{order.conclusion}</p>}</td><td className="max-w-xs whitespace-normal">{order.referenceRange || '—'}</td><td>{order.resultAt ? formatDateTime(order.resultAt) : '—'}</td><td><Badge tone="success">Đã có kết quả</Badge></td><td><Button variant="secondary" className="h-9 px-3 text-xs" onClick={() => setSelected(current => current?.id === order.id ? null : order)}><Paperclip className="size-4" />{selected?.id === order.id ? 'Đóng file' : 'File kết quả'}</Button></td></tr>)}</tbody></table></div>}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 p-4 text-xs text-slate-500"><span>{query.data?.total ?? 0} kết quả · 10 / trang</span><div className="flex items-center gap-2"><Button variant="secondary" disabled={page <= 1} onClick={() => { setPage(p => p - 1); setSelected(null) }}>Trước</Button><span>Trang {page} / {pages}</span><Button variant="secondary" disabled={page >= pages} onClick={() => { setPage(p => p + 1); setSelected(null) }}>Sau</Button></div></div>
    </>}</Card>
    {selected && !query.loading && !query.error && <AttachmentPanel recordId={selected.medicalRecordId} orderId={selected.id} canUpload />}
  </AppShell>
}
