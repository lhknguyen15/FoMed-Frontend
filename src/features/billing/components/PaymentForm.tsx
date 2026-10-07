import { CreditCard } from 'lucide-react'
import { useId } from 'react'
import { Button, Card } from '../../../components/ui'
import { cashPaymentPreview, formatPaymentMoney, parseCashReceived } from '../schemas/payment-schema'

type Method = 0 | 1 | 2 | 3
const methods = [{ value: 0, label: 'Tiền mặt' }, { value: 1, label: 'Thẻ' }, { value: 2, label: 'Chuyển khoản' }, { value: 3, label: 'Ví điện tử' }] as const
type Props = {
  amount: string; method: Method; note: string; remaining: number; active: boolean; submitting: boolean
  onAmountChange: (value: string) => void; onMethodChange: (value: Method) => void
  onNoteChange: (value: string) => void; onSubmit: () => void
}

export default function PaymentForm({ amount, method, note, remaining, active, submitting, onAmountChange, onMethodChange, onNoteChange, onSubmit }: Props) {
  const id = useId()
  const cash = method === 0
  const preview = cashPaymentPreview(amount, remaining)
  const showError = cash && active && amount.length > 0 && Boolean(preview.error)
  const disabled = !active || submitting
  return <Card className="p-5">
    <h2 className="font-display text-lg font-bold text-slate-900">Ghi nhận thanh toán</h2>
    <p className="mt-1 text-xs leading-5 text-slate-500">Thanh toán đủ số dư hóa đơn. Chưa hỗ trợ thu một phần tại màn hình này.</p>
    <form className="mt-5 space-y-4" onSubmit={(event) => { event.preventDefault(); onSubmit() }}>
      <label className="block"><span id={`${id}-method-label`} className="field-label">Hình thức</span><select aria-labelledby={`${id}-method-label`} disabled={disabled} value={method} onChange={(event) => onMethodChange(Number(event.target.value) as Method)} className="input-base">{methods.map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}</select></label>
      {cash && <div>
        <label htmlFor={`${id}-received`} className="field-label">Tiền khách đưa *</label>
        <div className={`flex items-center gap-2 rounded-xl border bg-white pr-3 focus-within:border-teal-500 focus-within:ring-4 focus-within:ring-teal-500/10 ${showError ? 'border-rose-300' : 'border-slate-200'}`}>
          <input id={`${id}-received`} type="text" inputMode="numeric" autoComplete="off" disabled={disabled} value={amount}
            onChange={(event) => onAmountChange(event.target.value)}
            onBlur={() => { const value = parseCashReceived(amount); if (value !== null) onAmountChange(value.toLocaleString('vi-VN')) }}
            placeholder="Ví dụ: 500.000" aria-invalid={showError} aria-describedby={`${id}-hint${showError ? ` ${id}-error` : ''}`}
            className="h-11 min-w-0 w-full rounded-xl bg-transparent px-3 text-right text-base tabular-nums text-slate-800 outline-none disabled:cursor-not-allowed disabled:opacity-60" />
          <span aria-hidden="true" className="shrink-0 text-sm font-semibold text-slate-500">đ</span>
        </div>
        <p id={`${id}-hint`} className="mt-2 text-xs leading-5 text-slate-500">Nhập tiền khách thực đưa. Chỉ số tiền cần thanh toán được ghi vào hóa đơn.</p>
        {showError && <p id={`${id}-error`} role="alert" className="mt-2 text-xs font-medium leading-5 text-rose-600">{preview.error}</p>}
      </div>}
      <dl aria-label="Đối chiếu thanh toán" aria-live="polite" className="space-y-3 rounded-xl border border-teal-100 bg-teal-50/60 p-4 text-sm">
        <div className="flex flex-wrap justify-between gap-2"><dt className="text-slate-600">Thanh toán hóa đơn</dt><dd className="break-all font-bold tabular-nums text-slate-900">{formatPaymentMoney(remaining)}</dd></div>
        {cash && <div className="flex flex-wrap justify-between gap-2 border-t border-teal-100 pt-3"><dt className="font-semibold text-teal-800">Tiền thừa cần trả</dt><dd className="break-all text-lg font-bold tabular-nums text-teal-800">{active && preview.change !== null ? formatPaymentMoney(preview.change) : '—'}</dd></div>}
        {!cash && <p className="text-xs leading-5 text-slate-500">{method === 2 ? 'Thanh toán được tự động xác nhận khi nhận được chuyển khoản đúng số tiền và nội dung. Không xác nhận thu thủ công.' : 'Xác nhận khi đã nhận đủ số tiền trên qua hình thức đã chọn. Không áp dụng tiền thừa.'}</p>}
      </dl>
      {method !== 2 && <label className="block"><span id={`${id}-note-label`} className="field-label">Mã giao dịch / ghi chú</span><textarea aria-labelledby={`${id}-note-label`} disabled={disabled} rows={2} value={note} onChange={(event) => onNoteChange(event.target.value)} className="input-base resize-none" /></label>}
      <Button type="submit" className="w-full" disabled={disabled || (cash && Boolean(preview.error))}><CreditCard className="size-4" />{submitting ? 'Đang xử lý...' : method === 2 ? 'Tạo mã QR SePay' : 'Xác nhận thu'}</Button>
    </form>
  </Card>
}
