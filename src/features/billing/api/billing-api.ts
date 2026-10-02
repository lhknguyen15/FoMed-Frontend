import { apiRequest } from '../../../shared/api/http-client'
import type { CreateMedicalServiceInput, Invoice, InvoiceCandidate, InvoiceCancelRequest, MedicalService, PaymentRequest, UpdateMedicalServiceInput } from '../types/billing'

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
  list: (page = 1) => apiRequest<Invoice[]>(`/invoices?page=${page}`),
  getById: (id: number) => apiRequest<Invoice>(`/invoices/${id}`),
  eligible: (page = 1) => apiRequest<InvoiceCandidate[]>(`/invoices/eligible?page=${page}`),
  pay: (id: number, request: PaymentRequest) => apiRequest<Invoice>(`/invoices/${id}/payments`, { method: 'POST', body: JSON.stringify(request) }),
  cancel: (id: number, request: InvoiceCancelRequest) => apiRequest<Invoice>(`/invoices/${id}/cancel`, { method: 'POST', body: JSON.stringify(request) }),
}
