import type { InvoiceFilters } from '../types/billing'

export const emptyInvoiceFilters: InvoiceFilters = { keyword: '', status: 'all', fromDate: '', toDate: '' }
export function validateInvoiceFilters(value: InvoiceFilters) {
  if (value.keyword.trim().length > 100) return 'Nội dung tìm kiếm không được vượt quá 100 ký tự.'
  if (value.fromDate && value.toDate && value.fromDate > value.toDate) return 'Ngày bắt đầu không được sau ngày kết thúc.'
  return ''
}
