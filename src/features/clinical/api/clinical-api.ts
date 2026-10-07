import { apiRequest } from '../../../shared/api/http-client'
import { apiDownload } from '../../../shared/api/http-client'
import type { PatientHistorySummary } from '../../appointments/types/appointment'
import type { ClinicalAttachment, ClinicalAttachmentPage, LabResultHistoryPage } from '../types/clinical'
import type { ClinicalCatalogItem, CreatePrescriptionRequest, MedicalRecord, MedicineSearch, OrderServiceRequest, PrescribingContext, Prescription, SaveLabResultRequest, SaveMedicalRecordRequest, ServiceOrder } from '../types/clinical'

// DateOnly? expects a date or null; a cleared HTML date input returns an invalid empty string.
const recordBody = (request: SaveMedicalRecordRequest) => JSON.stringify({ ...request, followUpDate: request.followUpDate?.trim() || null })

export const clinicalApi = {
  labResults: (keyword: string, page = 1) => apiRequest<LabResultHistoryPage>(`/clinical/lab-results?${new URLSearchParams({ keyword, page: String(page) })}`),
  attachments: (recordId: number, page = 1, orderId?: number) => apiRequest<ClinicalAttachmentPage>(`/clinical/records/${recordId}/attachments?${new URLSearchParams({ page: String(page), ...(orderId ? { orderId: String(orderId) } : {}) })}`),
  uploadAttachment: (recordId: number, file: File, orderId?: number) => {
    const body = new FormData(); body.append('file', file)
    return apiRequest<ClinicalAttachment>(`/clinical/records/${recordId}/attachments${orderId ? `?orderId=${orderId}` : ''}`, { method: 'POST', body })
  },
  downloadAttachment: (id: number) => apiDownload(`/clinical/attachments/${id}/download`),
  records: (page = 1) => apiRequest<MedicalRecord[]>(`/clinical/records?page=${page}`),
  record: (id: number) => apiRequest<MedicalRecord>(`/clinical/records/${id}`),
  recordHistory: (id: number) => apiRequest<PatientHistorySummary[]>(`/clinical/records/${id}/history`),
  prescription: (id: number) => apiRequest<Prescription>(`/clinical/records/${id}/prescription`),
  serviceOrders: (id: number) => apiRequest<ServiceOrder[]>(`/clinical/records/${id}/services`),
  createRecord: (appointmentId: number, request: SaveMedicalRecordRequest = {}) => apiRequest<MedicalRecord>(`/clinical/appointments/${appointmentId}/record`, { method: 'POST', body: recordBody(request) }),
  updateRecord: (id: number, request: SaveMedicalRecordRequest) => apiRequest<MedicalRecord>(`/clinical/records/${id}`, { method: 'PUT', body: recordBody(request) }),
  createPrescription: (id: number, request: CreatePrescriptionRequest) => apiRequest<Prescription>(`/clinical/records/${id}/prescription`, { method: 'POST', body: JSON.stringify(request) }),
  updatePrescription: (id: number, request: CreatePrescriptionRequest) => apiRequest<Prescription>(`/clinical/records/${id}/prescription`, { method: 'PUT', body: JSON.stringify(request) }),
  orderService: (id: number, request: OrderServiceRequest) => apiRequest<ServiceOrder>(`/clinical/records/${id}/services`, { method: 'POST', body: JSON.stringify(request) }),
  cancelOrder: (id: number) => apiRequest<ServiceOrder>(`/clinical/orders/${id}/cancel`, { method: 'PUT', body: JSON.stringify({}) }),
  medicines: (page = 1) => apiRequest<ClinicalCatalogItem[]>(`/clinical/medicines?page=${page}`),
  prescribingContext: (id: number, medicineIds: number[] = []) => {
    const params = new URLSearchParams()
    medicineIds.forEach(medicineId => params.append('medicineIds', String(medicineId)))
    return apiRequest<PrescribingContext>(`/clinical/records/${id}/prescribing-context?${params}`)
  },
  searchMedicines: (recordId: number, keyword: string, page = 1) => apiRequest<MedicineSearch>(`/clinical/medicines/search?${new URLSearchParams({ recordId: String(recordId), keyword, page: String(page) })}`),
  servicesCatalog: (page = 1) => apiRequest<ClinicalCatalogItem[]>(`/clinical/services?page=${page}`),
  pendingLabOrders: (page = 1) => apiRequest<ServiceOrder[]>(`/clinical/lab-orders?page=${page}`),
  saveLabResult: (id: number, request: SaveLabResultRequest) => apiRequest<ServiceOrder>(`/clinical/lab-orders/${id}/result`, { method: 'POST', body: JSON.stringify(request) }),
}
