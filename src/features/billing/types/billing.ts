export type MedicalService = {
  serviceId: number
  code?: string | null
  name: string
  description?: string | null
  price: number
  specialtyId?: number | null
  specialtyName?: string | null
  durationMinutes: number
  isActive: boolean
}

export type CreateMedicalServiceInput = {
  code?: string
  name: string
  description?: string
  price: number
  specialtyId?: number
  durationMinutes: number
}

export type UpdateMedicalServiceInput = CreateMedicalServiceInput & {
  isActive: boolean
}

export type PaymentRequest = { amount: number; method: 0 | 1 | 2 | 3; note?: string }
export type InvoiceCancelRequest = { reason?: string }
export type InvoiceCandidate = { medicalRecordId: number; appointmentId: number; patientId: number; patientName: string; appointmentStartTime: string; consultationFee: number; serviceAndMedicineAmount: number; estimatedTotalAmount: number }

export type InvoiceLine = { description?: string | null; quantity: number; unitPrice: number; amount: number }
export type Payment = { id: number; amount: number; method: number; paidAt: string }
export type Invoice = {
  id: number
  invoiceNo: string
  patientId: number
  medicalRecordId?: number | null
  totalAmount: number
  paidAmount: number
  status: number
  items: InvoiceLine[]
  payments: Payment[]
  consultationFee: number
}
