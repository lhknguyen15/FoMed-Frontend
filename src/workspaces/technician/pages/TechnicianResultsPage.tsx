import { ArrowLeft, CheckCircle2, ClipboardList, Info, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import AppShell from '../../../components/AppShell'
import { Badge, Button, Card, EmptyState, PageTitle } from '../../../components/ui'
import type { ServiceOrder } from '../../../features/clinical/types/clinical'
import { formatDateTime } from '../../../shared/utils/format-date'
import { clearTechnicianResults, readTechnicianResults } from '../utils/technician-results'

export default function TechnicianResultsPage() {
  const [rows, setRows] = useState<ServiceOrder[]>(readTechnicianResults)
  const clear = () => { clearTechnicianResults(); setRows([]) }

  return <AppShell><PageTitle eyebrow="Cận lâm sàng" title="Kết quả vừa trả" description="Theo dõi các kết quả đã được lưu trong phiên làm việc hiện tại." action={<div className="flex flex-wrap gap-2"><Link to="/technician/orders" className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:border-teal-300 hover:text-teal-800"><ArrowLeft className="size-4" /> Chỉ định chờ</Link><Button variant="secondary" disabled={!rows.length} onClick={clear}><RefreshCw className="size-4" /> Xóa danh sách phiên</Button></div>} />
    <div className="mb-5 flex items-start gap-3 rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-800"><Info className="mt-0.5 size-5 shrink-0" /><p><strong className="block">Giới hạn API hiện tại</strong>FoMed-API chưa có endpoint truy vấn danh sách chỉ định đã hoàn tất cho Kỹ thuật viên. Màn hình này giữ lại các response thành công trong phiên hiện tại; trạng thái thật đã được cập nhật trên server qua <code>POST /clinical/lab-orders/{'{id}'}/result</code>.</p></div>
    {!rows.length ? <EmptyState icon={<ClipboardList className="size-6" />} title="Chưa có kết quả trong phiên này" body="Sau khi lưu kết quả ở màn hình Chỉ định chờ thực hiện, kết quả sẽ xuất hiện tại đây." /> : <Card className="overflow-hidden"><div className="flex items-center justify-between border-b border-slate-100 p-5"><div><h2 className="font-display text-lg font-bold text-slate-900">Kết quả đã lưu</h2><p className="mt-1 text-sm text-slate-500">{rows.length} kết quả trong phiên hiện tại</p></div><Badge tone="success"><CheckCircle2 className="mr-1 size-3" /> Đã hoàn thành</Badge></div><div className="overflow-x-auto"><table className="data-table"><thead><tr><th>Dịch vụ</th><th>Bệnh án</th><th>Kết quả</th><th>Kết luận</th><th>Khoảng tham chiếu</th><th>Thời điểm</th><th>Trạng thái</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id}><td><strong>{row.serviceName}</strong></td><td>#{row.medicalRecordId}</td><td className="max-w-xs whitespace-normal">{row.resultSummary || '—'}</td><td className="max-w-xs whitespace-normal">{row.conclusion || '—'}</td><td>{row.referenceRange || '—'}</td><td>{row.resultAt ? formatDateTime(row.resultAt) : 'Vừa cập nhật'}</td><td><Badge tone="success">Đã có kết quả</Badge></td></tr>)}</tbody></table></div></Card>}
  </AppShell>
}
