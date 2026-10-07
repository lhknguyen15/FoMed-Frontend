import type { Invoice } from '../types/billing'

const cents = (value: number) => Math.round(value * 100)
const money = (value: number, max = 9999999999.99) => Number.isFinite(value) && value >= 0 && value <= max
  && Math.abs(value * 100 - cents(value)) < 0.001
const dateValid = (value?: string | null) => !!value && Number.isFinite(Date.parse(value))

// Verify only saved invoice/payment values, never tender input or the current medicine catalog.
export function invoicePrintError(invoice: Invoice, expectedId: number): string | null {
  if (invoice.id !== expectedId || !Number.isSafeInteger(invoice.id) || invoice.id < 1) return 'Hóa đơn đang tải không khớp với hóa đơn được chọn. Vui lòng tải lại.'
  if (!invoice.invoiceNo?.trim() || !invoice.patientName?.trim() || !invoice.patientCode?.trim() || !dateValid(invoice.createdAt)) return 'Hóa đơn chưa có đủ thông tin bệnh nhân hoặc ngày lập để in. Vui lòng tải lại hoặc liên hệ quản trị viên.'
  if (![0, 1, 2].includes(invoice.status) || !money(invoice.totalAmount) || !money(invoice.paidAmount) || !money(invoice.consultationFee)
    || !Array.isArray(invoice.items) || !Array.isArray(invoice.payments)) return 'Số liệu hóa đơn chưa hợp lệ để in. Vui lòng tải lại và kiểm tra.'
  if (invoice.items.some(item => !Number.isSafeInteger(item.quantity) || item.quantity < 1 || !money(item.unitPrice) || !money(item.amount)
    || cents(item.amount) !== cents(item.unitPrice) * item.quantity)) return 'Chi tiết chi phí chưa khớp. Vui lòng kiểm tra hóa đơn trước khi in.'
  if (cents(invoice.consultationFee) + invoice.items.reduce((sum, item) => sum + cents(item.amount), 0) !== cents(invoice.totalAmount)) return 'Tổng chi phí chưa khớp với các khoản mục. Vui lòng kiểm tra hóa đơn trước khi in.'
  if (invoice.payments.some(payment => !Number.isSafeInteger(payment.id) || payment.id < 1 || !money(payment.amount) || payment.amount <= 0
    || ![0, 1, 2, 3].includes(payment.method) || !dateValid(payment.paidAt))) return 'Lịch sử thanh toán chưa hợp lệ. Vui lòng kiểm tra trước khi in.'
  if (new Set(invoice.payments.map(payment => payment.id)).size !== invoice.payments.length
    || invoice.payments.reduce((sum, payment) => sum + cents(payment.amount), 0) !== cents(invoice.paidAmount)
    || cents(invoice.paidAmount) > cents(invoice.totalAmount)) return 'Khoản thu đã lưu chưa khớp với tổng kết hóa đơn. Vui lòng tải lại trước khi in.'
  if ((invoice.status === 1 && cents(invoice.paidAmount) !== cents(invoice.totalAmount))
    || (invoice.status === 0 && cents(invoice.paidAmount) === cents(invoice.totalAmount))
    || (invoice.status === 2 && invoice.payments.length > 0)) return 'Trạng thái hóa đơn chưa khớp với khoản thu. Vui lòng kiểm tra trước khi in.'
  if (invoice.payments.some(payment => payment.method === 0 && payment.cashReceived != null
    && (!money(payment.cashReceived, 10000000000) || !Number.isInteger(payment.cashReceived) || payment.cashReceived < payment.amount
      || payment.changeAmount == null || !money(payment.changeAmount, 10000000000)
      || cents(payment.changeAmount) !== cents(payment.cashReceived) - cents(payment.amount)))) return 'Tiền mặt và tiền thừa đã lưu chưa khớp. Vui lòng kiểm tra trước khi in.'
  return null
}

export const invoicePrintStatus = (invoice: Invoice) => invoice.status === 2 ? 'Đã hủy' : invoice.status === 1 ? 'Đã thanh toán' : invoice.paidAmount > 0 ? 'Thanh toán một phần' : 'Chưa thanh toán'
export const hasSimulatedPayments = (invoice: Invoice) => invoice.payments.some(payment => payment.providerEnvironment === 'Test')
export const printPaymentMethod = (method: number) => ['Tiền mặt', 'Thẻ', 'Chuyển khoản', 'Ví điện tử'][method] ?? 'Chưa ghi nhận'
export const printDateTime = (value: string) => new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date(value))
