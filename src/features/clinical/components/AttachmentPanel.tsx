import { notify } from '../../../shared/notifications/notify'
import { displayError } from '../../../shared/api/user-messages'
import { useRef, useState } from 'react'
import { Download, Paperclip, RefreshCw, Upload } from 'lucide-react'
import { Button } from '../../../components/ui'
import { useApiQuery } from '../../../shared/hooks/useApiQuery'
import { formatDateTime } from '../../../shared/utils/format-date'
import { clinicalApi } from '../api/clinical-api'
import type { ClinicalAttachment } from '../types/clinical'

export default function AttachmentPanel({ recordId, orderId, canUpload = false }: { recordId: number; orderId?: number; canUpload?: boolean }) {
  return <AttachmentList key={`${recordId}-${orderId ?? 'record'}`} recordId={recordId} orderId={orderId} canUpload={canUpload} />
}
function AttachmentList({ recordId, orderId, canUpload }: { recordId: number; orderId?: number; canUpload: boolean }) {
  const [page, setPage] = useState(1)
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const pending = useRef(false)
  const input = useRef<HTMLInputElement>(null)
  const query = useApiQuery(`attachments-${recordId}-${orderId}-${page}`, () => clinicalApi.attachments(recordId, page, orderId))
  const pages = Math.max(1, Math.ceil((query.data?.total ?? 0) / 10))
  const upload = async () => {
    if (!canUpload || !file || pending.current || busy) return
    if (!/\.(jpg|jpeg|png|pdf|dicom|dcm)$/i.test(file.name) || file.size <= 0 || file.size > 10 * 1024 * 1024) {
      setNotice('Chọn tệp JPG, PNG, PDF hoặc DICOM có dữ liệu, không quá 10 MB.'); return
    }
    pending.current = true; setBusy(true); setNotice('')
    try {
      await clinicalApi.uploadAttachment(recordId, file, orderId)
      setFile(null); if (input.current) input.current.value = ''
      setPage(1); query.refresh(); notify.success('Đã lưu tệp đính kèm.')
    } catch (reason) { setNotice(displayError(reason, 'Không thể tải tệp lên.')) }
    finally { pending.current = false; setBusy(false) }
  }
  const download = async (attachment: ClinicalAttachment) => {
    if (pending.current || busy || !attachment.downloadable) return
    pending.current = true; setBusy(true)
    try {
      const result = await clinicalApi.downloadAttachment(attachment.id)
      const url = URL.createObjectURL(result.blob)
      const anchor = document.createElement('a'); anchor.href = url; anchor.download = result.fileName || attachment.fileName
      document.body.appendChild(anchor); anchor.click(); anchor.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 1000)
      notify.success('Đã gửi tệp tới trình duyệt để tải xuống.')
    } catch (reason) { notify.error(reason, 'Không thể tải tệp xuống.') }
    finally { pending.current = false; setBusy(false) }
  }
  return <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white" aria-label="Tệp đính kèm">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4"><div><h3 className="flex items-center gap-2 text-sm font-bold text-slate-800"><Paperclip className="size-4 text-teal-700" />Tệp đính kèm{orderId ? ` · chỉ định #${orderId}` : ''}</h3><p className="mt-1 text-xs text-slate-500">Định dạng JPG, PNG, PDF, DICOM · tối đa 10 MB mỗi tệp. Chỉ người có quyền mới được xem và tải tệp.</p></div><Button variant="secondary" disabled={busy || query.loading} onClick={query.refresh}><RefreshCw className="size-4" />Làm mới danh sách</Button></div>
    {canUpload && <form onSubmit={event => { event.preventDefault(); void upload() }} className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50/50 p-4 sm:flex-row sm:items-end"><label className="min-w-0 flex-1"><span className="field-label">Chọn tệp đính kèm</span><input ref={input} aria-label="Chọn tệp đính kèm" type="file" accept=".jpg,.jpeg,.png,.pdf,.dicom,.dcm" disabled={busy} onChange={event => { setFile(event.target.files?.[0] ?? null); setNotice('') }} className="block w-full min-w-0 text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-teal-50 file:px-3 file:py-2 file:font-semibold file:text-teal-700" /></label><Button type="submit" disabled={!file || busy}><Upload className="size-4" />{busy ? 'Đang xử lý...' : 'Đính kèm tệp'}</Button></form>}
    {notice && <p role="alert" className="m-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{notice}</p>}
    {query.loading ? <p role="status" className="p-5 text-sm text-slate-500">Đang tải danh sách tệp...</p> : query.error ? <div className="p-4"><p role="alert" className="text-sm text-rose-700">{query.error}</p><Button variant="secondary" className="mt-3" onClick={query.refresh}>Thử lại danh sách tệp</Button></div> : <>
      {!query.data?.items.length ? <p className="p-5 text-sm text-slate-500">Chưa có tệp đính kèm.</p> : <ul className="divide-y divide-slate-100">{query.data.items.map(attachment => <li key={attachment.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><p className="break-words text-sm font-semibold text-slate-800 [overflow-wrap:anywhere]">{attachment.fileName}</p><p className="mt-1 text-xs text-slate-500">{(attachment.fileSize / 1024).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} KB · {formatDateTime(attachment.uploadedAt)}{attachment.orderId ? ` · chỉ định #${attachment.orderId}` : ''}</p>{!attachment.downloadable && <p className="mt-1 text-xs text-amber-700">Tệp cũ chưa chuyển sang kho lưu trữ riêng.</p>}</div><Button variant="secondary" disabled={busy || !attachment.downloadable} onClick={() => void download(attachment)} aria-label={`Tải tệp ${attachment.fileName}`}><Download className="size-4" />Tải tệp</Button></li>)}</ul>}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 p-4 text-xs text-slate-500"><span>{query.data?.total ?? 0} tệp · 10 / trang</span><div className="flex items-center gap-2"><Button variant="secondary" disabled={busy || page <= 1} onClick={() => setPage(p => p - 1)}>Trước</Button><span>Trang {page} / {pages}</span><Button variant="secondary" disabled={busy || page >= pages} onClick={() => setPage(p => p + 1)}>Sau</Button></div></div>
    </>}
  </section>
}
