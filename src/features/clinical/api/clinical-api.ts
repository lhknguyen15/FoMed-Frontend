import { apiRequest } from '../../../shared/api/http-client'
import type { ClinicalCatalogItem, CreatePrescriptionRequest, MedicalRecord, OrderServiceRequest, Prescription, SaveLabResultRequest, SaveMedicalRecordRequest, ServiceOrder } from '../types/clinical'

export const clinicalApi = {
  records: (page = 1) => apiRequest<MedicalRecord[]>(`/clinical/records?page=${page}`),
  record: (id: number) => apiRequest<MedicalRecord>(`/clinical/records/${id}`),
  prescription: (id: number) => apiRequest<Prescription>(`/clinical/records/${id}/prescription`),
  serviceOrders: (id: number) => apiRequest<ServiceOrder[]>(`/clinical/records/${id}/services`),
  createRecord: (appointmentId: number, request: SaveMedicalRecordRequest = {}) => apiRequest<MedicalRecord>(`/clinical/appointments/${appointmentId}/record`, { method: 'POST', body: JSON.stringify(request) }),
  updateRecord: (id: number, request: SaveMedicalRecordRequest) => apiRequest<MedicalRecord>(`/clinical/records/${id}`, { method: 'PUT', body: JSON.stringify(request) }),
  createPrescription: (id: number, request: CreatePrescriptionRequest) => apiRequest<Prescription>(`/clinical/records/${id}/prescription`, { method: 'POST', body: JSON.stringify(request) }),
  updatePrescription: (id: number, request: CreatePrescriptionRequest) => apiRequest<Prescription>(`/clinical/records/${id}/prescription`, { method: 'PUT', body: JSON.stringify(request) }),
  orderService: (id: number, request: OrderServiceRequest) => apiRequest<ServiceOrder>(`/clinical/records/${id}/services`, { method: 'POST', body: JSON.stringify(request) }),
  cancelOrder: (id: number) => apiRequest<ServiceOrder>(`/clinical/orders/${id}/cancel`, { method: 'PUT', body: JSON.stringify({}) }),
  medicines: (page = 1) => apiRequest<ClinicalCatalogItem[]>(`/clinical/medicines?page=${page}`),
  servicesCatalog: (page = 1) => apiRequest<ClinicalCatalogItem[]>(`/clinical/services?page=${page}`),
  pendingLabOrders: (page = 1) => apiRequest<ServiceOrder[]>(`/clinical/lab-orders?page=${page}`),
  saveLabResult: (id: number, request: SaveLabResultRequest) => apiRequest<ServiceOrder>(`/clinical/lab-orders/${id}/result`, { method: 'POST', body: JSON.stringify(request) }),
}
