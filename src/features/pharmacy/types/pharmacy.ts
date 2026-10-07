export type InventoryBatch = {
  batchId: number
  medicineId: number
  medicineName: string
  unit?: string | null
  lotNumber: string
  expiryDate: string
  quantity: number
  unitPrice: number
  isExpired: boolean
}

export type ReceiveStockRequest = { medicineId: number; lotNumber: string; expiryDate: string; quantity: number }
export type AdjustStockRequest = { batchId: number; quantity: number; reason: string }
export type ReceiveStockLineRequest = { medicineId: number; lotNumber: string; expiryDate: string; quantity: number; unitCost: number }
export type InventoryReceiptRequest = { supplierName: string; documentNo: string; note?: string; items: ReceiveStockLineRequest[] }
export type InventoryReceiptResponse = { id: number; supplierName: string; documentNo: string; receivedAt: string; totalAmount: number; items: InventoryReceiptLine[] }
export type InventoryReceiptLine = { medicineId: number; medicineName: string; lotNumber: string; expiryDate: string; quantity: number; unitCost: number; lineAmount: number }
export type StockTransaction = { id: number; batchId: number; type: number; quantity: number; refType?: string | null; refId?: number | null; createdAt: string }
export type DispensedLine = { prescriptionItemId: number; medicineId: number; medicineName: string; batchId: number; lotNumber: string; quantity: number; expiryDate: string }
export type DispensePrescriptionResponse = { prescriptionId: number; dispensedAt: string; alreadyDispensed: boolean; lines: DispensedLine[] }

export type PharmacyPrescription = {
  prescriptionId: number
  medicalRecordId: number
  patientName: string
  patientCode: string
  doctorName: string
  isFinalized: boolean
  appointmentStatus: number
  isDispensed: boolean
  isFullyDispensed: boolean
  canDispense: boolean
  blockedReason: string | null
  items: { medicineId: number; medicineName: string; quantity: number; dispensedQuantity: number; dosage?: string | null; instruction?: string | null;
    unit?: string | null; availableQuantity: number; remainingQuantity: number; shortageQuantity: number;
    proposedBatches: { batchId: number; lotNumber: string; expiryDate: string; availableQuantity: number; proposedQuantity: number }[] }[]
}
export type PharmacyPrescriptionPage = { items: { prescriptionId: number; medicalRecordId: number; patientName: string;
  patientCode: string; doctorName: string; createdAt: string; isFullyDispensed: boolean }[]; page: number; pageSize: number; total: number }
