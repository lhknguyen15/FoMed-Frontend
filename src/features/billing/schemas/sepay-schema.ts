import type { SePayPaymentRequest } from '../types/billing'

const statuses = new Set(['Pending', 'Paid', 'Expired', 'Superseded', 'ReviewRequired', 'InvoiceSettled', 'InvoiceCancelled'])

// Reject unexpected responses rather than showing a QR or claiming payment on invalid data.
export function validateSePayRequest(value: SePayPaymentRequest, invoiceId: number, requestId?: string) {
  if (!value || value.invoiceId !== invoiceId || (requestId && value.id !== requestId)
    || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value.id)
    || !['Test', 'Live'].includes(value.environment) || !statuses.has(value.status)
    || !/^FM[0-9A-F]{24}$/.test(value.code)
    || !Number.isSafeInteger(value.amount) || value.amount <= 0
    || !Number.isFinite(value.remainingAmount) || value.remainingAmount < 0
    || (value.status === 'Pending' && value.remainingAmount !== value.amount)
    || (value.status === 'Paid' && value.remainingAmount !== 0)
    || ![value.bankCode, value.accountNumber, value.accountName].every(field => typeof field === 'string' && field.trim().length > 0)
    || typeof value.createdAt !== 'string' || typeof value.expiresAt !== 'string'
    || !Number.isFinite(Date.parse(value.createdAt)) || !Number.isFinite(Date.parse(value.expiresAt))
    || !value.createdAt.endsWith('Z') || !value.expiresAt.endsWith('Z')
    || Date.parse(value.expiresAt) <= Date.parse(value.createdAt)) {
    throw new Error('Thông tin thanh toán không hợp lệ. Vui lòng tải lại hóa đơn, không chuyển tiền theo thông tin này.')
  }
  if (value.status === 'Pending') {
    let url: URL
    try { url = new URL(value.qrUrl ?? '') } catch { throw new Error('Không thể tạo mã QR thanh toán. Vui lòng thử lại, không chuyển tiền theo thông tin này.') }
    if (url.origin !== 'https://vietqr.app' || url.pathname !== '/img' || url.username || url.password
      || !['acc', 'bank', 'amount', 'des'].every(key => url.searchParams.getAll(key).length === 1)
      || url.searchParams.get('acc') !== value.accountNumber || url.searchParams.get('bank') !== value.bankCode
      || url.searchParams.get('amount') !== String(value.amount) || url.searchParams.get('des') !== value.code) {
      throw new Error('Mã QR không khớp thông tin thanh toán. Không chuyển tiền.')
    }
  }
  return value
}
