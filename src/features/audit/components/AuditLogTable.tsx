import { useEffect, useRef, useState } from 'react'
import { ShieldCheck, X } from 'lucide-react'
import { Button } from '../../../components/ui'
import { formatDateTime } from '../../../shared/utils/format-date'
import type { AuditLog } from '../types/audit'

const roleNames: Record<string, string> = { Admin: 'Quản trị viên', Doctor: 'Bác sĩ', Patient: 'Bệnh nhân', Receptionist: 'Lễ tân', Technician: 'Kỹ thuật viên', Pharmacist: 'Dược sĩ' }
const fieldNames: Record<string, string> = { Attachments: 'File đính kèm', MedicalRecord: 'Bệnh án', Symptoms: 'Triệu chứng', Diagnosis: 'Chẩn đoán', Note: 'Ghi chú', VitalSigns: 'Sinh hiệu', Icd10Code: 'Mã ICD-10', TreatmentPlan: 'Hướng điều trị', FollowUpDate: 'Ngày tái khám', Prescription: 'Đơn thuốc', ServiceOrders: 'Chỉ định cận lâm sàng', LabResults: 'Kết quả cận lâm sàng', IsFinalized: 'Trạng thái chốt', FinalizedAt: 'Thời điểm chốt' }
const sourceNames: Record<string, string> = { UploadAttachment: 'Thêm file đính kèm', AttachmentList: 'Xem danh sách file', DownloadAttachment: 'Tải file đính kèm', LabResultHistory: 'Xem lịch sử kết quả', Record: 'Xem bệnh án', RecordList: 'Xem trong danh sách bệnh án', RecordHistory: 'Xem lịch sử khám trong bệnh án', Prescription: 'Xem đơn thuốc', ServiceOrders: 'Xem chỉ định và kết quả', PrescribingContext: 'Xem thông tin kê đơn', DoctorQueueHistory: 'Xem lịch sử trong hàng đợi khám', PatientHistorySummary: 'Xem lịch sử khám tại quầy', LabQueue: 'Xem hàng đợi xét nghiệm', CreateRecord: 'Tạo bệnh án', UpdateRecord: 'Cập nhật bệnh án', FinalizeRecord: 'Chốt bệnh án', CreatePrescription: 'Tạo đơn thuốc', UpdatePrescription: 'Cập nhật đơn thuốc', OrderService: 'Chỉ định cận lâm sàng', CancelServiceOrder: 'Hủy chỉ định', SaveLabResult: 'Lưu kết quả cận lâm sàng' }
const auditActionName = (action: string) => ({ Read: 'Xem bệnh án', Create: 'Tạo bệnh án', Update: 'Cập nhật bệnh án', Finalize: 'Chốt bệnh án' }[action] || 'Ghi nhận bệnh án')
const eventName = (log: AuditLog) => log.source ? sourceNames[log.source] || auditActionName(log.action) : log.action === 'Read' && !log.entityId ? 'Đọc danh sách (nhật ký cũ)' : auditActionName(log.action)
const roles = (log: AuditLog) => log.roles?.map(role => roleNames[role] || 'Vai trò khác').join(', ') || 'Chưa ghi nhận vai trò'

export default function AuditLogTable({ items }: { items: AuditLog[] }) {
  const [selected, setSelected] = useState<AuditLog | null>(null)
  return <>
    <div className="min-w-0 max-w-full overflow-x-auto"><table className="data-table"><thead><tr><th>Thời gian</th><th>Người thực hiện</th><th>Loại ghi nhận</th><th>Mã bệnh án</th><th>IP</th><th className="relative"><span className="sr-only">Chi tiết nhật ký</span></th></tr></thead>
      <tbody>{items.map(log => <tr key={log.auditLogId}>
        <td className="whitespace-nowrap">{formatDateTime(log.createdAt)}</td>
        <td><p className="font-semibold text-slate-800">{log.fullName || log.username || (log.userId ? `Người dùng #${log.userId}` : 'Hệ thống')}</p><p className="mt-1 text-xs text-slate-500">{log.username && `@${log.username} · `}{roles(log)}</p></td>
        <td><span className="inline-flex items-start gap-1.5 text-violet-700"><ShieldCheck className="mt-0.5 size-4 shrink-0" />{eventName(log)}</span></td>
        <td className="whitespace-nowrap">{log.entityId ? `#${log.entityId}` : '—'}</td>
        <td className="max-w-44 break-all font-mono text-xs text-slate-500">{log.ipAddress || 'Chưa ghi nhận'}</td>
        <td><Button variant="secondary" className="h-8 px-3 text-xs" onClick={() => setSelected(log)} aria-label={`Chi tiết nhật ký #${log.auditLogId}`}>Chi tiết</Button></td>
      </tr>)}</tbody>
    </table></div>
    {selected && <AuditDetail log={selected} onClose={() => setSelected(null)} />}
  </>
}

function AuditDetail({ log, onClose }: { log: AuditLog; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const dialog = dialogRef.current!
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialog.showModal()
    return () => { dialog.close(); document.body.style.overflow = previousOverflow; previousFocus?.focus() }
  }, [])
  const details = [
    ['Thời gian', formatDateTime(log.createdAt)], ['Loại ghi nhận', eventName(log)],
    ['Bệnh án', log.entityId ? `#${log.entityId}` : 'Danh sách (nhật ký cũ)'],
    ['Người thực hiện', log.fullName || log.username || 'Chưa ghi nhận'], ['Tài khoản', log.username ? `@${log.username}` : 'Chưa ghi nhận'],
    ['Mã người dùng', log.userId ? String(log.userId) : 'Chưa ghi nhận'], ['Vai trò', roles(log)],
    ['IP kết nối', log.ipAddress || 'Không có thông tin trong nhật ký này'], ['Mã truy vết yêu cầu', log.requestId || 'Không có thông tin trong nhật ký này'],
  ]
  return <dialog ref={dialogRef} aria-labelledby="audit-detail-title" onCancel={event => { event.preventDefault(); onClose() }} className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%_-_2rem)] max-w-xl overflow-y-auto rounded-3xl border-0 bg-white p-6 shadow-2xl backdrop:bg-slate-950/40 backdrop:backdrop-blur-sm sm:p-8">
    <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[.15em] text-teal-700">Nhật ký bệnh án</p><h2 id="audit-detail-title" className="mt-1 font-display text-xl font-bold text-slate-900">Ghi nhận #{log.auditLogId}</h2></div><button type="button" onClick={onClose} aria-label="Đóng chi tiết nhật ký" className="grid size-9 shrink-0 place-items-center rounded-xl text-slate-400 hover:bg-slate-100"><X className="size-5" /></button></div>
    <p className="mt-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">{log.actorSnapshot ? 'Người thực hiện và vai trò được ghi nhận tại thời điểm thao tác.' : 'Nhật ký cũ chưa lưu thông tin tại thời điểm thao tác. Tên và vai trò đang lấy từ tài khoản hiện tại, có thể đã thay đổi.'}</p>
    <dl className="mt-5 space-y-3">{details.map(([label, value]) => <div key={label} className="grid gap-1 border-b border-slate-100 pb-3 sm:grid-cols-[160px_1fr]"><dt className="text-xs font-semibold text-slate-500">{label}</dt><dd className="min-w-0 break-words text-sm text-slate-800 [overflow-wrap:anywhere]">{value}</dd></div>)}</dl>
    {!!log.changedFields?.length && <div className="mt-4"><p className="mb-2 text-xs font-semibold text-slate-500">Các nhóm thông tin đã thay đổi</p><div className="flex flex-wrap gap-2">{log.changedFields.map(field => <span key={field} className="rounded-lg bg-violet-50 px-2 py-1 text-xs text-violet-700">{fieldNames[field] || 'Thông tin khác'}</span>)}</div></div>}
    <p className="mt-4 text-xs leading-5 text-slate-500">Chỉ hiển thị thông tin truy vết, không cung cấp nội dung bệnh án. Nhật ký chỉ được ghi thêm, không có chức năng sửa hoặc xóa.</p>
    <div className="mt-5 flex justify-end"><Button variant="secondary" onClick={onClose}>Đóng</Button></div>
  </dialog>
}
