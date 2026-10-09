import { displayError } from '../../../shared/api/user-messages'
import { notify } from '../../../shared/notifications/notify'
import { ArrowLeft, CheckCircle2, FileText, Printer, ReceiptText, XCircle } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import AppShell from '../../../components/AppShell'
import { Badge, Button, Card, PageTitle } from '../../../components/ui'
import { invoiceApi } from '../../../features/billing/api/billing-api'
import PaymentForm from '../../../features/billing/components/PaymentForm'
import PaymentHistory from '../../../features/billing/components/PaymentHistory'
import SePayPaymentModal from '../../../features/billing/components/SePayPaymentModal'
import { validateSePayRequest } from '../../../features/billing/schemas/sepay-schema'
import type { PaymentRequest, SePayPaymentRequest } from '../../../features/billing/types/billing'
import { cashPaymentPreview, formatPaymentMoney } from '../../../features/billing/schemas/payment-schema'
import { useApiQuery } from '../../../shared/hooks/useApiQuery'
import ReceptionReasonModal from '../components/ReceptionReasonModal'
import { invoiceDetailPath, invoiceListReturnTo } from '../../../features/billing/utils/invoice-navigation'

export default function ReceptionCashierPage() {
  const location = useLocation()
  const returnTo = invoiceListReturnTo(new URLSearchParams(location.search).get('returnTo'))
  const navigate = useNavigate()
  const { invoiceId } = useParams()
  const id = Number(invoiceId)
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState<0 | 1 | 2 | 3>(0)
  const [note, setNote] = useState('')
  const [cancelOpen, setCancelOpen] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [sepay, setSepay] = useState<SePayPaymentRequest | null>(null)
  const [reviewInvoiceId, setReviewInvoiceId] = useState<number | null>(null)
  const formRef = useRef<HTMLDivElement>(null)
  const successRef = useRef<HTMLDivElement>(null)
  const restorePaymentFocus = useRef<'waiting' | 'loading' | null>(null)
  const paymentAttempt = useRef<{ invoiceId: number; fingerprint: string; request: PaymentRequest } | null>(null)
  const mutationPending = useRef(false)
  const announcedCreation = useRef<string | null>(null)
  const invoice = useApiQuery(`reception-invoice-${id}`, () => invoiceApi.getById(id))
  const data = invoice.data
  const attempt = paymentAttempt.current?.invoiceId === id ? paymentAttempt.current.request : null
  const recoveredPayment = !invoice.loading && !invoice.error && data?.id === id && attempt
    ? data.payments.find((payment) => payment.idempotencyKey === attempt.idempotencyKey && payment.amount === attempt.amount
      && payment.method === attempt.method && (payment.cashReceived ?? undefined) === attempt.cashReceived)
    : undefined
  const remaining = data ? Number(Math.max(data.totalAmount - data.paidAmount, 0).toFixed(2)) : 0
  // A zero balance alone (or a modal result) must not mark an invoice as paid.
  const invoicePaid = !invoice.loading && !invoice.error && data?.id === id && data.status === 1
    && Number.isFinite(data.totalAmount) && Number.isFinite(data.paidAmount)
    && data.totalAmount >= 0 && data.paidAmount >= data.totalAmount && remaining === 0
  const active = !invoice.loading && !invoice.error && data?.id === id && data.status === 0 && remaining > 0 && reviewInvoiceId !== id
  useEffect(() => {
    if (location.state?.invoiceCreated && announcedCreation.current !== location.key) {
      announcedCreation.current = location.key
      notify.success('Đã lập hóa đơn thành công.', `invoice-created-${id}-${location.key}`)
    }
  }, [id, location.key, location.state])
  useEffect(() => {
    if (restorePaymentFocus.current && invoice.loading) restorePaymentFocus.current = 'loading'
    if (!invoice.loading && !sepay && restorePaymentFocus.current === 'loading') {
      const target = formRef.current?.querySelector<HTMLSelectElement>('select')
      if (target && !target.disabled) target.focus()
      else if (data?.status === 1 && successRef.current) {
        successRef.current.focus()
        successRef.current.scrollIntoView({ block: 'nearest' })
      }
      else if (invoicePaid) {
        formRef.current?.focus()
        formRef.current?.scrollIntoView({ block: 'nearest' })
      }
      restorePaymentFocus.current = null
    }
  }, [invoice.loading, sepay, data?.status, invoicePaid])

  const pay = async () => {
    if (mutationPending.current || !active || !Number.isFinite(remaining) || remaining > 9999999999.99) return
    const preview = cashPaymentPreview(amount, remaining)
    if (method === 0 && preview.error) { setError(preview.error); return }
    mutationPending.current = true
    setSubmitting(true); setError(''); setSuccess('')
    try {
      if (method === 2) {
        // The backend determines the debt and reuses pending requests. No amount or secret from the browser.
        setSepay(validateSePayRequest(await invoiceApi.createSePayRequest(id), id))
        return
      }
      // Retry the same payload with the same key; changing the payment creates a new attempt.
      const payload: PaymentRequest = { amount: remaining, method, note: note.trim() || undefined,
        ...(method === 0 && preview.received !== null ? { cashReceived: preview.received } : {}) }
      const fingerprint = JSON.stringify(payload)
      if (paymentAttempt.current?.invoiceId !== id || paymentAttempt.current.fingerprint !== fingerprint) {
        paymentAttempt.current = { invoiceId: id, fingerprint, request: { ...payload, idempotencyKey: crypto.randomUUID() } }
      }
      await invoiceApi.pay(id, paymentAttempt.current.request)
      paymentAttempt.current = null
      setAmount(''); setNote(''); notify.success('Đã ghi nhận thanh toán thành công.', `invoice-payment-${id}`); invoice.refresh()
    } catch (reason) {
      setError(displayError(reason, 'Không thể ghi nhận thanh toán.'))
      // Reconcile debt/status after an error rather than blindly retrying a possibly committed payment.
      invoice.refresh()
    } finally { mutationPending.current = false; setSubmitting(false) }
  }
  const cancel = async (reason: string) => {
    if (mutationPending.current || !active || !data || data.paidAmount > 0) return
    mutationPending.current = true
    setSubmitting(true); setError('')
    try { await invoiceApi.cancel(id, { reason }); setCancelOpen(false); notify.success('Đã hủy hóa đơn.', `invoice-cancelled-${id}`); invoice.refresh() }
    catch (value) { setError(displayError(value, 'Không thể hủy hóa đơn.')) }
    finally { mutationPending.current = false; setSubmitting(false) }
  }
  return <AppShell>
    <PageTitle eyebrow="Bàn tiếp đón · Thu ngân" title={data ? `Hóa đơn ${data.invoiceNo}` : 'Thu ngân'} description={invoicePaid ? 'Tra cứu khoản thu và in hóa đơn đã thanh toán.' : 'Thu tiền mặt, đối chiếu tiền thừa hoặc thanh toán chuyển khoản qua SePay.'} action={<Button variant="secondary" disabled={submitting} onClick={() => navigate(returnTo)}><ArrowLeft className="size-4" />Về danh sách hóa đơn</Button>} />
    {reviewInvoiceId === id && <p role="alert" className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">Giao dịch SePay đang cần đối soát. Màn hình tạm khóa thao tác thu thêm và hủy hóa đơn; liên hệ quản trị viên, không thu lại tiền.</p>}
    {success && <div ref={successRef} tabIndex={-1} className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
      <p role="status" className="flex items-center gap-2 font-semibold"><CheckCircle2 className="size-5 shrink-0" />{success}</p>
    </div>}
    {error && (recoveredPayment
      ? <p role="status" className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">Đã đối soát: giao dịch #{recoveredPayment.id} được ghi nhận dù phản hồi trước đó bị gián đoạn. Kiểm tra lịch sử thanh toán bên dưới, không thu lại.</p>
      : <p role="alert" className="mb-5 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-700"><XCircle className="size-5 shrink-0" />{error}</p>)}
    {invoice.loading ? <Card className="grid min-h-72 place-items-center"><span className="size-9 animate-spin rounded-full border-4 border-teal-100 border-t-teal-700" /></Card>
      : invoice.error || !data ? <Card className="p-8 text-center"><ReceiptText className="mx-auto size-10 text-rose-500" /><p className="mt-3 text-sm text-slate-500">{invoice.error || 'Không tìm thấy hóa đơn.'}</p><Button className="mt-5" onClick={invoice.refresh}>Thử lại</Button></Card>
      : <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Card className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5">
            <div><h2 className="font-display text-lg font-bold text-slate-900">Chi tiết hóa đơn</h2><p className="mt-1 text-sm text-slate-500">Bệnh nhân #{data.patientId} · Hồ sơ #{data.medicalRecordId ?? '—'}</p></div>
            <Badge tone={data.status === 1 ? 'success' : data.status === 2 ? 'danger' : data.paidAmount > 0 ? 'warning' : 'info'}>{data.status === 1 ? 'Đã thanh toán' : data.status === 2 ? 'Đã hủy' : data.paidAmount > 0 ? 'Thanh toán một phần' : 'Chưa thanh toán'}</Badge>
          </div>
          <div className="overflow-x-auto"><table className="data-table"><thead><tr><th>Nội dung</th><th>Loại</th><th>SL</th><th>Đơn giá</th><th>Thành tiền</th></tr></thead><tbody>
            {data.consultationFee > 0 && <tr><td>Phí khám</td><td><Badge tone="info">Dịch vụ</Badge></td><td>1</td><td>{formatPaymentMoney(data.consultationFee)}</td><td>{formatPaymentMoney(data.consultationFee)}</td></tr>}
            {data.items.map((item, index) => <tr key={`${item.description}-${index}`}><td>{item.description || 'Khoản mục khác'}</td><td><Badge tone="neutral">Dịch vụ / thuốc</Badge></td><td>{item.quantity}</td><td>{formatPaymentMoney(item.unitPrice)}</td><td>{formatPaymentMoney(item.amount)}</td></tr>)}
          </tbody></table></div>
        </Card>
        <div className="space-y-6">
          <Card className="p-5"><h2 className="font-display text-lg font-bold text-slate-900">Tổng kết</h2><div className="mt-5 space-y-3 text-sm">
            <p className="flex flex-wrap justify-between gap-2"><span className="text-slate-500">Tổng cộng</span><strong className="break-all tabular-nums">{formatPaymentMoney(data.totalAmount)}</strong></p>
            <p className="flex flex-wrap justify-between gap-2"><span className="text-slate-500">Đã thu</span><strong className="break-all tabular-nums text-emerald-700">{formatPaymentMoney(data.paidAmount)}</strong></p>
            <p className="flex flex-wrap justify-between gap-2 border-t border-slate-100 pt-3"><span className="font-semibold text-slate-700">Còn phải thu</span><strong className={`break-all font-display text-xl tabular-nums ${invoicePaid ? 'text-emerald-700' : 'text-rose-600'}`}>{formatPaymentMoney(remaining)}</strong></p>
          </div></Card>
          <div ref={formRef} tabIndex={invoicePaid ? -1 : undefined} role={invoicePaid ? 'region' : undefined} aria-label={invoicePaid ? 'Hóa đơn đã thanh toán' : undefined}>
            {invoicePaid ? <Card className="border-emerald-200 bg-emerald-50/50 p-5">
              <h2 className="flex items-center gap-2 font-display text-lg font-bold text-emerald-800"><CheckCircle2 aria-hidden="true" className="size-6 shrink-0" />Đã thanh toán</h2>
              <dl className="mt-4 text-sm"><div className="flex flex-wrap justify-between gap-2"><dt className="text-slate-600">Số tiền đã thu</dt><dd className="break-all font-bold tabular-nums text-emerald-800">{formatPaymentMoney(data.paidAmount)}</dd></div></dl>
              <p className="mt-3 text-sm leading-6 text-slate-600">Hóa đơn không còn công nợ. Không thu thêm tiền cho hóa đơn này.</p>
              <p className="mt-2 text-xs leading-5 text-slate-500">Kiểm tra các khoản thu trong lịch sử thanh toán bên dưới hoặc chọn In hóa đơn.</p>
            </Card> : <PaymentForm amount={amount} method={method} note={note} remaining={remaining} active={active} submitting={submitting}
              onAmountChange={(value) => { setAmount(value); setError('') }} onMethodChange={(value) => { setMethod(value); setAmount(''); setError('') }} onNoteChange={setNote} onSubmit={() => void pay()} />}
          </div>
          <PaymentHistory payments={data.payments} />
          <Card className="p-5"><div className="flex flex-wrap gap-2"><Button variant="secondary" disabled={submitting || invoice.loading || !!invoice.error || data.id !== id || !!sepay || reviewInvoiceId === id} onClick={() => navigate(invoiceDetailPath(id, returnTo, true))}><Printer className="size-4" />In hóa đơn</Button><Button variant="secondary" disabled title="Có thể lưu thành PDF từ cửa sổ in; tải PDF trực tiếp chưa khả dụng."><FileText className="size-4" />Xuất PDF</Button>{!invoicePaid && <Button variant="danger" disabled={submitting || !active || data.paidAmount > 0} onClick={() => setCancelOpen(true)}>Hủy hóa đơn</Button>}</div><p className="mt-3 text-xs leading-5 text-slate-500">Lịch sử lấy từ giao dịch đã lưu: tiền khách đưa không làm tăng doanh thu. Giao dịch cũ có thể chưa ghi nhận tiền khách đưa hoặc người thu. Hoàn tiền chưa được hỗ trợ.</p></Card>
        </div>
      </div>}
    {cancelOpen && <ReceptionReasonModal title="Hủy hóa đơn" description="Chỉ hóa đơn chưa phát sinh thanh toán mới được hủy." submitLabel="Xác nhận hủy" danger error={error} submitting={submitting} onClose={() => { if (!mutationPending.current) setCancelOpen(false) }} onSubmit={cancel} />}
    {sepay?.invoiceId === id && <SePayPaymentModal key={sepay.id} initial={sepay} invoiceNo={data?.id === id ? data.invoiceNo : undefined} onClose={() => { restorePaymentFocus.current = 'waiting'; setSepay(null); invoice.refresh() }} onTerminal={value => {
      if (value.status === 'Paid') setSuccess(`Thanh toán${value.environment === 'Test' ? ' mô phỏng' : ''} thành công. SePay đã xác nhận và khoản thu đã được ghi nhận${value.environment === 'Test' ? ' (chế độ thử nghiệm)' : ''}.`)
      if (value.status === 'InvoiceSettled') setSuccess('Hóa đơn đã được thanh toán. Không chuyển thêm tiền.')
      if (value.status === 'InvoiceCancelled') setError('Hóa đơn đã hủy. Không chuyển tiền.')
      if (value.status === 'ReviewRequired') setReviewInvoiceId(id)
      invoice.refresh()
    }} />}
  </AppShell>
}
