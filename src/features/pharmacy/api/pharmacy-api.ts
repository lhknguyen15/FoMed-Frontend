import { apiRequest } from '../../../shared/api/http-client'
import type { AdjustStockRequest, DispensePrescriptionResponse, InventoryBatch, InventoryReceiptRequest, InventoryReceiptResponse, StockTransaction, ReceiveStockRequest } from '../types/pharmacy'
import type { PharmacyPrescription, PharmacyPrescriptionPage } from '../types/pharmacy'

export const pharmacyApi = {
  prescriptions: (keyword: string, status = 'pending', page = 1) => apiRequest<PharmacyPrescriptionPage>(`/pharmacy/prescriptions?${new URLSearchParams({ keyword, status, page: String(page) })}`),
  prescription: (id: number) => apiRequest<PharmacyPrescription>(`/pharmacy/prescriptions/${id}`),
  inventory: (page = 1, medicineId?: number, expiringBefore?: string) => {
    const params = new URLSearchParams({ page: String(page) })
    if (medicineId) params.set('medicineId', String(medicineId))
    if (expiringBefore) params.set('expiringBefore', expiringBefore)
    return apiRequest<InventoryBatch[]>(`/pharmacy/inventory?${params.toString()}`)
  },
  receiveStock: (request: ReceiveStockRequest) => apiRequest<InventoryBatch>('/pharmacy/inventory/receipts', { method: 'POST', body: JSON.stringify(request) }),
  receiveReceipt: (request: InventoryReceiptRequest) => apiRequest<InventoryReceiptResponse>('/pharmacy/receipts', { method: 'POST', body: JSON.stringify(request) }),
  adjustStock: (request: AdjustStockRequest) => apiRequest<InventoryBatch>('/pharmacy/inventory/adjustments', { method: 'POST', body: JSON.stringify(request) }),
  transactions: (batchId: number, page = 1) => apiRequest<StockTransaction[]>(`/pharmacy/inventory/${batchId}/transactions?page=${page}`),
  dispense: (prescriptionId: number) => apiRequest<DispensePrescriptionResponse>(`/pharmacy/prescriptions/${prescriptionId}/dispense`, { method: 'POST' }),
}
