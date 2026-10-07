import { useState } from 'react'
import { BookOpenCheck, RotateCcw, Search, ShieldCheck } from 'lucide-react'
import { Button, Card } from '../../../components/ui'
import { auditApi } from '../../../features/audit/api/audit-api'
import AuditLogTable from '../../../features/audit/components/AuditLogTable'
import { useApiQuery } from '../../../shared/hooks/useApiQuery'
import { CMSEmpty, CMSError, CMSLoading } from '../../components/CMSDataTable'
import CMSPageHeader from '../../components/CMSPageHeader'

const PAGE_SIZE = 10
const initialFilters = { userId: '', from: '', to: '', action: 'Read' }
const queryDate = (value: string, end = false) => {
  if (!value) return undefined
  // Clinic days use UTC+07, independent of the browser/server's timezone.
  const date = new Date(`${value}T00:00:00+07:00`)
  if (!Number.isFinite(date.getTime())) throw new Error('Ngày lọc không hợp lệ.')
  if (end) date.setUTCDate(date.getUTCDate() + 1)
  return date.toISOString()
}

export default function AuditLogPage() {
  const [draft, setDraft] = useState(initialFilters)
  const [applied, setApplied] = useState(initialFilters)
  const [page, setPage] = useState(1)
  const [validation, setValidation] = useState('')
  const logs = useApiQuery(`medical-record-audit-${JSON.stringify(applied)}-${page}`, () => auditApi.list({
    entity: 'MedicalRecord', action: applied.action || undefined, userId: applied.userId ? Number(applied.userId) : undefined,
    from: queryDate(applied.from), to: queryDate(applied.to, true), page, pageSize: PAGE_SIZE,
  }))
  const applyFilters = () => {
    const userId = draft.userId.trim()
    if (userId && (!/^\d+$/.test(userId) || Number(userId) < 1 || Number(userId) > 2147483647)) {
      setValidation('Mã người dùng phải là số nguyên dương hợp lệ.'); return
    }
    if (draft.from && draft.to && draft.from > draft.to) {
      setValidation('Từ ngày không được sau đến ngày.'); return
    }
    try { queryDate(draft.from); queryDate(draft.to, true) }
    catch { setValidation('Ngày lọc không hợp lệ.'); return }
    setValidation(''); setApplied({ ...draft, userId }); setPage(1); logs.refresh()
  }
  const clearFilters = () => { setDraft(initialFilters); setApplied(initialFilters); setPage(1); setValidation(''); logs.refresh() }
  const totalPages = logs.data ? Math.max(1, Math.ceil(logs.data.total / logs.data.pageSize)) : 1
  return <>
    <CMSPageHeader title="Truy cập bệnh án" description="Tra cứu người xem, tạo, sửa hoặc chốt bệnh án. Chỉ hiển thị thông tin truy vết, không mở nội dung bệnh án."
      action={<span className="inline-flex items-center gap-2 rounded-xl bg-violet-50 px-3 py-2 text-sm font-semibold text-violet-700"><BookOpenCheck className="size-4" />Chỉ xem · Admin</span>} />
    <Card className="min-w-0 max-w-full overflow-hidden">
      <form onSubmit={event => { event.preventDefault(); applyFilters() }} className="grid items-end gap-3 border-b border-slate-100 p-4 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_1fr_auto_auto]">
        <label className="block min-w-0"><span className="mb-1 block text-xs font-semibold text-slate-500">Người thực hiện</span><div className="relative"><Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><input inputMode="numeric" maxLength={10} value={draft.userId} onChange={event => setDraft(current => ({ ...current, userId: event.target.value }))} placeholder="Mã người dùng" aria-label="Mã người thực hiện" className="input-base admin-search-input" /></div></label>
        <label className="block min-w-0"><span className="mb-1 block text-xs font-semibold text-slate-500">Từ ngày</span><input type="date" value={draft.from} onChange={event => setDraft(current => ({ ...current, from: event.target.value }))} className="input-base" /></label>
        <label className="block min-w-0"><span className="mb-1 block text-xs font-semibold text-slate-500">Đến ngày</span><input type="date" value={draft.to} onChange={event => setDraft(current => ({ ...current, to: event.target.value }))} className="input-base" /></label>
        <label className="block min-w-0"><span className="mb-1 block text-xs font-semibold text-slate-500">Loại ghi nhận</span><select aria-label="Loại ghi nhận" value={draft.action} onChange={event => setDraft(current => ({ ...current, action: event.target.value }))} className="input-base"><option value="Read">Truy cập bệnh án</option><option value="">Tất cả ghi nhận bệnh án</option><option value="Create">Tạo bệnh án</option><option value="Update">Cập nhật bệnh án</option><option value="Finalize">Chốt bệnh án</option></select></label>
        <Button type="submit" variant="secondary" disabled={logs.loading}><ShieldCheck className="size-4" />Lọc nhật ký</Button>
        <Button type="button" variant="secondary" onClick={clearFilters}><RotateCcw className="size-4" />Xóa lọc</Button>
      </form>
      {validation && <p role="alert" className="m-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{validation}</p>}
      {logs.loading ? <CMSLoading /> : logs.error || !logs.data ? <CMSError message={logs.error} retry={logs.refresh} /> : <>
        {logs.data.items.length === 0 ? <CMSEmpty label="ghi nhận bệnh án phù hợp bộ lọc" /> : <AuditLogTable items={logs.data.items} />}
        <div className="flex flex-col justify-between gap-3 border-t border-slate-100 px-5 py-4 text-xs text-slate-500 sm:flex-row sm:items-center">
          <span>Hiển thị {logs.data.items.length} / {logs.data.total} ghi nhận · 10 / trang</span>
          <div className="flex items-center gap-2"><Button variant="secondary" className="h-8 px-3 text-xs" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Trước</Button><span>Trang {page} / {totalPages}</span><Button variant="secondary" className="h-8 px-3 text-xs" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Sau</Button></div>
        </div>
      </>}
    </Card>
  </>
}
