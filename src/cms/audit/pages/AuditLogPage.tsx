import { useState } from 'react'
import { RotateCcw, Search, ShieldCheck } from 'lucide-react'
import { Button, Card } from '../../../components/ui'
import { auditApi } from '../../../features/audit/api/audit-api'
import { useApiQuery } from '../../../shared/hooks/useApiQuery'
import { formatDateTime } from '../../../shared/utils/format-date'
import { CMSEmpty, CMSError, CMSLoading } from '../../components/CMSDataTable'
import CMSPageHeader from '../../components/CMSPageHeader'

export default function AuditLogPage() {
  const [entity, setEntity] = useState('')
  const [action, setAction] = useState('')
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
  const logs = useApiQuery(`audit-${entity}-${action}-${userId}-${from}-${to}-${page}`, () => auditApi.list({ entity, action, userId: userId ? Number(userId) : undefined, from: queryDate(from), to: queryDate(to, true), page, pageSize: 50 }))
  const clearFilters = () => { setEntity(''); setAction(''); setUserId(''); setFrom(''); setTo(''); setPage(1) }
  const totalPages = logs.data ? Math.max(1, Math.ceil(logs.data.total / logs.data.pageSize)) : 1
  const formatChange = (value?: string | null) => {
    if (!value) return '—'
    try { return JSON.stringify(JSON.parse(value), null, 2) } catch { return value }
  }
  return <><CMSPageHeader title="Nhật ký hệ thống" description="Theo dõi các thao tác nghiệp vụ và thay đổi dữ liệu nhạy cảm." /><Card className="overflow-hidden"><div className="grid gap-3 border-b border-slate-100 p-4 sm:grid-cols-2 xl:grid-cols-6"><label className="relative sm:col-span-2 xl:col-span-2"><Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><input type="search" name="audit-entity" autoComplete="off" value={entity} onChange={(event) => { setEntity(event.target.value); setPage(1) }} placeholder="Đối tượng (User, Service...)" className="input-base admin-search-input" /></label><input value={action} onChange={(event) => { setAction(event.target.value); setPage(1) }} placeholder="Hành động (Create, Update...)" className="input-base" /><input type="number" min="1" value={userId} onChange={(event) => { setUserId(event.target.value); setPage(1) }} placeholder="Mã người dùng" aria-label="Mã người dùng" className="input-base" /><input type="date" value={from} onChange={(event) => { setFrom(event.target.value); setPage(1) }} aria-label="Từ ngày" className="input-base" /><input type="date" value={to} onChange={(event) => { setTo(event.target.value); setPage(1) }} aria-label="Đến ngày" className="input-base" /><Button variant="secondary" onClick={clearFilters}><RotateCcw className="size-4" /> Xóa lọc</Button></div>{logs.loading ? <CMSLoading /> : logs.error || !logs.data ? <CMSError message={logs.error} retry={logs.refresh} /> : logs.data.items.length === 0 ? <CMSEmpty label="nhật ký phù hợp" /> : <><div className="overflow-x-auto"><table className="data-table"><thead><tr><th>Thời gian</th><th>Người thực hiện</th><th>Hành động</th><th>Đối tượng</th><th>Thay đổi</th></tr></thead><tbody>{logs.data.items.map((log) => <tr key={log.auditLogId}><td>{formatDateTime(log.createdAt)}</td><td>{log.username || 'Hệ thống'}</td><td><span className="inline-flex items-center gap-1 text-violet-700"><ShieldCheck className="size-3" />{log.action}</span></td><td>{log.entity}{log.entityId ? ` #${log.entityId}` : ''}</td><td className="max-w-sm whitespace-normal font-mono text-xs">{log.newValue || log.oldValue ? <details><summary className="cursor-pointer font-sans font-semibold text-teal-700">Xem chi tiết</summary><pre className="mt-2 max-w-sm whitespace-pre-wrap break-words rounded-lg bg-slate-50 p-3">{formatChange(log.newValue || log.oldValue)}</pre></details> : '—'}</td></tr>)}</tbody></table></div><div className="flex flex-col justify-between gap-3 border-t border-slate-100 px-5 py-4 text-xs text-slate-500 sm:flex-row sm:items-center"><span>Hiển thị {logs.data.items.length} / {logs.data.total} bản ghi</span><span className="flex items-center gap-2"><Button variant="secondary" className="h-8 px-3 text-xs" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Trước</Button><span>Trang {page} / {totalPages}</span><Button variant="secondary" className="h-8 px-3 text-xs" disabled={page >= totalPages} onClick={() => setPage((value) => value + 1)}>Sau</Button></span></div></>}</Card></>
}
