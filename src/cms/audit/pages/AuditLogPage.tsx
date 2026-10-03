import { useState } from 'react'
import { BookOpenCheck, RotateCcw, Search, ShieldCheck } from 'lucide-react'
import { Button, Card } from '../../../components/ui'
import { auditApi } from '../../../features/audit/api/audit-api'
import { useApiQuery } from '../../../shared/hooks/useApiQuery'
import { formatDateTime } from '../../../shared/utils/format-date'
import { CMSEmpty, CMSError, CMSLoading } from '../../components/CMSDataTable'
import CMSPageHeader from '../../components/CMSPageHeader'

const PAGE_SIZE = 10

export default function AuditLogPage() {
  const [userId, setUserId] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [page, setPage] = useState(1)
  const queryDate = (value: string, end = false) => {
    if (!value) return undefined
    const date = new Date(`${value}T00:00:00`)
    if (end) date.setDate(date.getDate() + 1)
    return date.toISOString()
  }
  const logs = useApiQuery(`medical-record-access-${userId}-${from}-${to}-${page}`, () => auditApi.list({ entity: 'MedicalRecord', action: 'Read', userId: userId ? Number(userId) : undefined, from: queryDate(from), to: queryDate(to, true), page, pageSize: PAGE_SIZE }))
  const clearFilters = () => { setUserId(''); setFrom(''); setTo(''); setPage(1) }
  const totalPages = logs.data ? Math.max(1, Math.ceil(logs.data.total / logs.data.pageSize)) : 1
  return <>
    <CMSPageHeader title="Truy cập bệnh án" description="Nhật ký kiểm tra truy cập hồ sơ bệnh án theo VC-24. Trang này chỉ đọc audit log, không mở nội dung bệnh án." action={<span className="inline-flex items-center gap-2 rounded-xl bg-violet-50 px-3 py-2 text-sm font-semibold text-violet-700"><BookOpenCheck className="size-4" />Chỉ xem · Admin</span>} />
    <Card className="overflow-hidden">
      <div className="grid items-end gap-3 border-b border-slate-100 p-4 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_auto_auto]"><label className="relative block"><Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><input type="number" min="1" value={userId} onChange={e => { setUserId(e.target.value); setPage(1) }} placeholder="Mã người truy cập" aria-label="Mã người truy cập" className="input-base admin-search-input" /></label><label className="block"><span className="mb-1 block text-xs font-semibold text-slate-500">Từ ngày</span><input type="date" value={from} onChange={e => { setFrom(e.target.value); setPage(1) }} className="input-base" /></label><label className="block"><span className="mb-1 block text-xs font-semibold text-slate-500">Đến ngày</span><input type="date" value={to} onChange={e => { setTo(e.target.value); setPage(1) }} className="input-base" /></label><Button variant="secondary" onClick={() => logs.refresh()}><ShieldCheck className="size-4" />Lọc nhật ký</Button><Button variant="secondary" onClick={clearFilters}><RotateCcw className="size-4" />Xóa lọc</Button></div>
      {logs.loading ? <CMSLoading /> : logs.error || !logs.data ? <CMSError message={logs.error} retry={logs.refresh} /> : logs.data.items.length === 0 ? <CMSEmpty label="lượt truy cập bệnh án" /> : <>
        <div className="overflow-x-auto"><table className="data-table"><thead><tr><th>Thời gian</th><th>Người truy cập</th><th>Loại truy cập</th><th>Mã bệnh án</th></tr></thead><tbody>{logs.data.items.map(log => <tr key={log.auditLogId}><td className="whitespace-nowrap">{formatDateTime(log.createdAt)}</td><td>{log.username || (log.userId ? `Người dùng #${log.userId}` : 'Hệ thống')}</td><td><span className="inline-flex items-center gap-1.5 text-violet-700"><ShieldCheck className="size-4" />{log.entityId ? 'Mở hồ sơ bệnh án' : 'Đọc danh sách bệnh án'}</span></td><td>{log.entityId ? `#${log.entityId}` : '—'}</td></tr>)}</tbody></table></div>
        <div className="flex flex-col justify-between gap-3 border-t border-slate-100 px-5 py-4 text-xs text-slate-500 sm:flex-row sm:items-center"><span>Hiển thị {logs.data.items.length} / {logs.data.total} lượt truy cập</span><span className="flex items-center gap-2"><Button variant="secondary" className="h-8 px-3 text-xs" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Trước</Button><span>Trang {page} / {totalPages}</span><Button variant="secondary" className="h-8 px-3 text-xs" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Sau</Button></span></div>
      </>}
    </Card>
  </>
}
