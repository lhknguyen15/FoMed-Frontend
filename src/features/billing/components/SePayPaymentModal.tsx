import { CheckCircle2, Copy, QrCode, RefreshCw, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Button } from '../../../components/ui'
import { useSePayPayment } from '../hooks/useSePayPayment'
import { formatPaymentMoney } from '../schemas/payment-schema'
import type { SePayPaymentRequest, SePayStatus } from '../types/billing'

const messages: Record<SePayStatus, string> = {
  Pending: 'Đang chờ xác nhận thanh toán', Paid: 'SePay đã xác nhận thanh toán',
  Expired: 'Yêu cầu đã hết hạn. Không chuyển tiền theo mã này.',
  Superseded: 'Mã này đã được thay thế. Không sử dụng để chuyển tiền.',
  ReviewRequired: 'Giao dịch cần đối soát. Không thu lại; liên hệ quản trị viên kiểm tra.',
  InvoiceSettled: 'Hóa đơn đã được thanh toán. Không chuyển thêm tiền.',
  InvoiceCancelled: 'Hóa đơn đã hủy. Không chuyển tiền.',
}

export default function SePayPaymentModal({ initial, invoiceNo, onClose, onTerminal }: {
  initial: SePayPaymentRequest; invoiceNo?: string; onClose: () => void; onTerminal: (value: SePayPaymentRequest) => void
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const { request, error, checking, retry } = useSePayPayment(initial, onTerminal)
  const [now, setNow] = useState(() => Date.now())
  const [copyMessage, setCopyMessage] = useState('')
  const [imageFailed, setImageFailed] = useState(false)
  useEffect(() => {
    const dialog = dialogRef.current!
    const focus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'; dialog.showModal()
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => { clearInterval(timer); dialog.close(); document.body.style.overflow = overflow; focus?.focus() }
  }, [])
  const seconds = Math.max(0, Math.ceil((Date.parse(request.expiresAt) - now) / 1000))
  const pending = request.status === 'Pending'
  const paid = request.status === 'Paid'
  const test = request.environment === 'Test'
  const canTransfer = pending && seconds > 0 && !error
  useEffect(() => {
    if (paid) {
      // Announce the result in the foreground, even if the cashier scrolled down.
      dialogRef.current!.scrollTop = 0
      titleRef.current?.focus()
    }
  }, [paid])
  const copy = async (value: string, label: string) => {
    try { await navigator.clipboard.writeText(value); setCopyMessage(`Đã sao chép ${label.toLowerCase()}.`) }
    catch { setCopyMessage('Không thể sao chép tự động. Bạn có thể chọn và sao chép thông tin bên dưới.') }
  }
  return <dialog ref={dialogRef} aria-labelledby="sepay-title" onCancel={event => { event.preventDefault(); onClose() }} className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%_-_2rem)] max-w-2xl overflow-y-auto rounded-3xl border-0 bg-white p-5 shadow-2xl backdrop:bg-slate-950/40 backdrop:backdrop-blur-sm sm:p-7">
    <header className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-widest text-teal-700">Chuyển khoản ngân hàng</p><h2 ref={titleRef} id="sepay-title" tabIndex={-1} className="mt-1 text-xl font-bold text-slate-900">{paid ? test ? 'Thanh toán mô phỏng thành công' : 'Thanh toán thành công' : 'Thanh toán qua SePay'}</h2></div><button type="button" onClick={onClose} aria-label="Đóng thanh toán SePay" className="grid size-9 shrink-0 place-items-center rounded-xl text-slate-500 hover:bg-slate-100"><X className="size-5" /></button></header>
    {test && <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-800">{paid ? 'Chế độ thử nghiệm — đây là giao dịch mô phỏng, không có tiền thật được chuyển.' : 'Chế độ thử nghiệm — chỉ mô phỏng giao dịch. Không chuyển tiền thật; mã QR được ẩn để bảo đảm an toàn.'}</p>}
    {paid ? <>
      <div role="status" aria-live="polite" aria-atomic="true" className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-center text-emerald-900">
        <CheckCircle2 aria-hidden="true" className="mx-auto size-12 text-emerald-600" />
        <p className="mt-3 font-semibold">{test ? 'SePay đã xác nhận giao dịch mô phỏng.' : 'SePay đã xác nhận giao dịch thành công.'}</p>
        {invoiceNo && <p className="mt-2 break-words text-sm [overflow-wrap:anywhere]">Hóa đơn {invoiceNo}</p>}
        <p className="mt-4 text-sm">{test ? 'Số tiền đã ghi nhận mô phỏng' : 'Số tiền đã thanh toán'}</p>
        <p className="mt-1 break-all text-3xl font-bold tabular-nums">{formatPaymentMoney(request.amount)}</p>
        <p className="mt-4 text-sm leading-6">Khoản thu đã được ghi nhận. Không chuyển thêm tiền hoặc thu lại cho giao dịch này.</p>
      </div>
      <p className="mt-4 text-sm leading-6 text-slate-500">Hóa đơn được tải lại tự động để cập nhật số đã thu, công nợ và lịch sử thanh toán.</p>
      <footer className="mt-5 flex justify-end"><Button onClick={onClose}>Xem hóa đơn</Button></footer>
    </> : <>
    <div role="status" aria-live="polite" className="mt-4 flex items-start gap-2 rounded-xl bg-slate-100 p-3 text-sm font-semibold text-slate-700">
      <span>{messages[request.status]}{pending && seconds === 0 && ' · Đã hết thời gian hiển thị QR, đang kiểm tra trạng thái trên máy chủ.'}</span>
    </div>
    {error && <div role="alert" className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700"><p>{error}</p><p className="mt-1">Chưa xác định được kết quả. Không chuyển hoặc thu lại tiền trước khi đối soát.</p><Button variant="secondary" className="mt-3" disabled={checking} onClick={retry}><RefreshCw className="size-4" />Kiểm tra lại trạng thái</Button></div>}
    <div className="mt-5 grid min-w-0 gap-5 sm:grid-cols-[200px_minmax(0,1fr)]">
      <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 p-4">
        {canTransfer && request.environment === 'Live' && request.qrUrl && !imageFailed
          ? <img src={request.qrUrl} alt="Mã QR thanh toán hóa đơn" referrerPolicy="no-referrer" className="aspect-square w-full max-w-48 object-contain" onError={() => setImageFailed(true)} />
          : <><QrCode className="size-20 text-slate-300" /><p className="mt-3 text-center text-xs leading-5 text-slate-500">{request.environment === 'Test' ? 'Mô phỏng bằng số tiền và nội dung bên cạnh' : imageFailed && canTransfer ? 'Không tải được ảnh QR. Kiểm tra trạng thái trước khi chuyển khoản theo thông tin bên cạnh.' : 'Mã QR không khả dụng'}</p></>}
        {canTransfer && <p className="mt-3 text-sm tabular-nums text-slate-600">Còn {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')}</p>}
      </div>
      <dl className="min-w-0 space-y-3 text-sm">
        <div><dt className="text-xs text-slate-500">Số tiền cần chuyển</dt><dd className="mt-1 break-all text-xl font-bold tabular-nums text-teal-700">{formatPaymentMoney(request.amount)}</dd></div>
        <div><dt className="text-xs text-slate-500">Ngân hàng · Chủ tài khoản</dt><dd className="mt-1 break-words [overflow-wrap:anywhere]">{request.bankCode} · {request.accountName}</dd></div>
        {([['Số tài khoản', request.accountNumber], ['Nội dung chuyển khoản', request.code]] as const).map(([label, value]) => <div key={label}><dt className="text-xs text-slate-500">{label}</dt><dd className="mt-1 flex min-w-0 items-start gap-2"><span className="min-w-0 flex-1 select-all break-all font-mono font-semibold">{value}</span><button type="button" disabled={!canTransfer} onClick={() => void copy(value, label)} aria-label={`Sao chép ${label.toLowerCase()}`} className="grid size-8 shrink-0 place-items-center rounded-lg border border-slate-200 text-slate-500 disabled:opacity-40"><Copy className="size-4" /></button></dd></div>)}
        {copyMessage && <p role="status" className="text-xs text-teal-700">{copyMessage}</p>}
      </dl>
    </div>
    <p className="mt-5 text-xs leading-5 text-slate-500">Chuyển đúng số tiền và giữ nguyên nội dung. Đóng cửa sổ không hủy yêu cầu chuyển khoản. Nếu khách đã chuyển tiền, kiểm tra trạng thái trước khi chọn cách thu khác.</p>
    <footer className="mt-5 flex justify-end"><Button variant="secondary" onClick={onClose}>Đóng</Button></footer>
    </>}
  </dialog>
}
