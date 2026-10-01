import { useState } from 'react'
import { Search, ShieldCheck } from 'lucide-react'
import { Card } from '../../../components/ui'
import { auditApi } from '../../../features/audit/api/audit-api'
import { useApiQuery } from '../../../shared/hooks/useApiQuery'
import { formatDateTime } from '../../../shared/utils/format-date'
import { CMSEmpty, CMSError, CMSLoading } from '../../components/CMSDataTable'
import CMSPageHeader from '../../components/CMSPageHeader'

export default function AuditLogPage() {
  const [action, setAction] = useState('')
  const logs = useApiQuery(`audit-${action}`, () => auditApi.list({ action }))
  return <><CMSPageHeader title="Nhật ký hệ thống" description="Theo dõi các thao tác nghiệp vụ và thay đổi dữ liệu nhạy cảm." /><Card className="overflow-hidden"><div className="border-b border-slate-100 p-4"><label className="relative block max-w-md"><Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><input value={action} onChange={(event) => setAction(event.target.value)} placeholder="Lọc theo hành động..." className="input-base pl-10" /></label></div>{logs.loading ? <CMSLoading /> : logs.error || !logs.data ? <CMSError message={logs.error} retry={logs.refresh} /> : logs.data.items.length === 0 ? <CMSEmpty label="nhật ký phù hợp" /> : <div className="overflow-x-auto"><table className="data-table"><thead><tr><th>Thời gian</th><th>Người thực hiện</th><th>Hành động</th><th>Đối tượng</th><th>Thay đổi</th></tr></thead><tbody>{logs.data.items.map((log) => <tr key={log.auditLogId}><td>{formatDateTime(log.createdAt)}</td><td>{log.username || 'Hệ thống'}</td><td><span className="inline-flex items-center gap-1 text-violet-700"><ShieldCheck className="size-3" />{log.action}</span></td><td>{log.entity}{log.entityId ? ` #${log.entityId}` : ''}</td><td className="max-w-xs truncate font-mono text-xs">{log.newValue || log.oldValue || '—'}</td></tr>)}</tbody></table></div>}</Card></>
}
