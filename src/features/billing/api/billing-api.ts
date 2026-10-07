import { apiRequest } from '../../../shared/api/http-client'
import type { CreateMedicalServiceInput, Invoice, InvoiceCandidate, InvoiceCancelRequest, InvoiceFilters, InvoiceSearchPage, MedicalService, PaymentRequest, SePayPaymentRequest, UpdateMedicalServiceInput } from '../types/billing'

export const serviceAdminApi = {
  list: () => apiRequest<MedicalService[]>('/admin/services'),
  create: (request: CreateMedicalServiceInput) => apiRequest<MedicalService>('/admin/services', {
    method: 'POST',
    body: JSON.stringify(request),
  }),
  update: (serviceId: number, request: UpdateMedicalServiceInput) => apiRequest<MedicalService>(`/admin/services/${serviceId}`, {
    method: 'PUT',
    body: JSON.stringify(request),
  }),
}

export const invoiceApi = {
  create: (medicalRecordId: number) => apiRequest<Invoice>('/invoices', { method: 'POST', body: JSON.stringify({ medicalRecordId }) }),
  list: (page = 1) => apiRequest<Invoice[]>(`/invoices?page=${page}`),
  search: (filter: InvoiceFilters, page = 1) => {
    const params = new URLSearchParams({ page: String(page), status: filter.status })
    if (filter.keyword.trim()) params.set('keyword', filter.keyword.trim())
    if (filter.fromDate) params.set('fromDate', filter.fromDate)
    if (filter.toDate) params.set('toDate', filter.toDate)
    return apiRequest<InvoiceSearchPage>(`/invoices/search?${params}`)
  },
  getById: (id: number) => apiRequest<Invoice>(`/invoices/${id}`),
  eligible: (page = 1) => apiRequest<InvoiceCandidate[]>(`/invoices/eligible?page=${page}`),
  pay: (id: number, request: PaymentRequest) => apiRequest<Invoice>(`/invoices/${id}/payments`, { method: 'POST', body: JSON.stringify(request) }),
  cancel: (id: number, request: InvoiceCancelRequest) => apiRequest<Invoice>(`/invoices/${id}/cancel`, { method: 'POST', body: JSON.stringify(request) }),
  createSePayRequest: (id: number) => apiRequest<SePayPaymentRequest>(`/invoices/${id}/sepay/payment-requests`, { method: 'POST' }),
  getSePayRequest: (id: number, requestId: string, signal?: AbortSignal) => apiRequest<SePayPaymentRequest>(`/invoices/${id}/sepay/payment-requests/${encodeURIComponent(requestId)}`, { signal }),
}
