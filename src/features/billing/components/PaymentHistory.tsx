import { Card } from '../../../components/ui'
import { formatDateTime } from '../../../shared/utils/format-date'
import { formatPaymentMoney } from '../schemas/payment-schema'
import type { Payment } from '../types/billing'

const methods = ['Tiền mặt', 'Thẻ', 'Chuyển khoản', 'Ví điện tử']

export default function PaymentHistory({ payments }: { payments: Payment[] }) {
  if (!payments.length) return null
  return <Card className="min-w-0 p-5">
    <section aria-label="Lịch sử thanh toán">
      <h3 className="font-display font-bold text-slate-900">Lịch sử thanh toán</h3>
      <div className="mt-4 max-h-[520px] space-y-4 overflow-y-auto overscroll-contain">
        {[...payments].sort((a, b) => b.id - a.id).map((payment) => <article key={payment.id} className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div><p className="font-semibold text-slate-800">{methods[payment.method] ?? 'Không xác định'} · #{payment.id}</p><p className="mt-1 text-xs text-slate-500">{formatDateTime(payment.paidAt)}</p></div>
            <div className="min-w-0"><p className="text-xs text-slate-500">Đã thu vào hóa đơn</p><strong className="break-all tabular-nums text-emerald-700">{formatPaymentMoney(payment.amount)}</strong></div>
          </div>
          {payment.provider === 'SePay'
            ? <p className="mt-3 break-words text-xs text-slate-500">Xác nhận tự động bởi SePay · Giao dịch #{payment.providerTransactionId ?? '—'}{payment.providerEnvironment === 'Test' ? ' · Giao dịch mô phỏng' : ''}</p>
            : <p className="mt-3 break-words text-xs text-slate-500">Người thu: {payment.receivedByName || (payment.receivedBy != null ? `Nhân viên #${payment.receivedBy}` : 'Chưa ghi nhận (giao dịch cũ)')}</p>}
          {payment.method === 0 && (payment.cashReceived != null && payment.changeAmount != null
            ? <dl aria-label="Tiền mặt đã xác nhận" className="mt-3 grid gap-3 border-t border-slate-200 pt-3 sm:grid-cols-3 xl:grid-cols-1">
              <div><dt className="text-xs text-slate-500">Tiền khách đưa</dt><dd className="mt-1 break-all font-semibold tabular-nums">{formatPaymentMoney(payment.cashReceived)}</dd></div>
              <div><dt className="text-xs text-slate-500">Đã thanh toán hóa đơn</dt><dd className="mt-1 break-all font-semibold tabular-nums">{formatPaymentMoney(payment.amount)}</dd></div>
              <div><dt className="text-xs text-slate-500">Tiền thừa trả khách</dt><dd className="mt-1 break-all font-bold tabular-nums text-teal-700">{formatPaymentMoney(payment.changeAmount)}</dd></div>
            </dl>
            : <p className="mt-3 text-xs text-slate-500">Chưa ghi nhận tiền khách đưa và tiền thừa cho giao dịch này.</p>)}
        </article>)}
      </div>
    </section>
  </Card>
}
