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

export type PaymentRequest = { amount: number; method: 0 | 1 | 2 | 3; note?: string; cashReceived?: number; idempotencyKey?: string }
export type InvoiceCancelRequest = { reason?: string }
export type InvoiceCandidate = { medicalRecordId: number; appointmentId: number; patientId: number; patientName: string; appointmentStartTime: string; consultationFee: number; serviceAndMedicineAmount: number; estimatedTotalAmount: number }

export type InvoiceLine = { description?: string | null; quantity: number; unitPrice: number; amount: number }
export type Payment = {
  id: number
  amount: number
  method: number
  paidAt: string
  cashReceived?: number | null
  changeAmount?: number | null
  receivedBy?: number | null
  receivedByName?: string | null
  idempotencyKey?: string | null
  provider?: string | null
  providerEnvironment?: string | null
  providerTransactionId?: number | null
}
export type SePayStatus = 'Pending' | 'Paid' | 'Expired' | 'Superseded' | 'ReviewRequired' | 'InvoiceSettled' | 'InvoiceCancelled'
export type SePayPaymentRequest = {
  id: string; invoiceId: number; environment: 'Test' | 'Live'; code: string; amount: number
  bankCode: string; accountNumber: string; accountName: string
  createdAt: string; expiresAt: string; status: SePayStatus; qrUrl: string | null; remainingAmount: number
}
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
