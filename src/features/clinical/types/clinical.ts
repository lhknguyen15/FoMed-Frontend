export type VitalSigns = {
  systolic?: number | null
  diastolic?: number | null
  heartRate?: number | null
  temperature?: number | null
  weightKg?: number | null
  heightCm?: number | null
}

export type MedicalRecord = {
  id: number
  appointmentId: number
  patientId: number
  doctorId: number
  symptoms?: string | null
  diagnosis?: string | null
  note?: string | null
  vitalSigns?: VitalSigns | null
  icd10Code?: string | null
  treatmentPlan?: string | null
  followUpDate?: string | null
  isFinalized: boolean
  finalizedAt?: string | null
  createdAt: string
  updatedAt?: string | null
}

export type PrescriptionLine = {
  medicineId: number
  medicineName: string
  quantity: number
  unitPriceSnapshot: number
  dosage?: string | null
  instruction?: string | null
}

export type Prescription = { id: number; medicalRecordId: number; note?: string | null; items: PrescriptionLine[]; isDispensed: boolean }

export type ServiceOrder = {
  id: number
  medicalRecordId: number
  serviceId: number
  serviceName: string
  status: number
  quantity: number
  unitPriceSnapshot: number
  resultSummary?: string | null
  conclusion?: string | null
  referenceRange?: string | null
  resultAt?: string | null
}

export type SaveMedicalRecordRequest = {
  symptoms?: string
  diagnosis?: string
  note?: string
  vitalSigns?: VitalSigns | null
  icd10Code?: string
  treatmentPlan?: string
  followUpDate?: string | null
}

export type PrescriptionLineRequest = {
  medicineId: number
  quantity: number
  dosage: string
  instruction?: string
}

export type CreatePrescriptionRequest = {
  note?: string
  allergyAcknowledged: boolean
  items: PrescriptionLineRequest[]
}

export type OrderServiceRequest = { serviceId: number; quantity: number }
export type ClinicalCatalogItem = { id: number; name: string; price: number }
export type PrescribingMedicine = { id: number; name: string; unit?: string | null; price: number; availableQuantity: number }
export type PrescribingContext = { medicalRecordId: number; patientName: string; allergies?: string | null; medicines: PrescribingMedicine[] }
export type MedicineSearch = { items: PrescribingMedicine[]; page: number; pageSize: number; totalCount: number }
export type SaveLabResultRequest = { resultSummary: string; conclusion?: string; referenceRange?: string }
export type LabResultHistoryPage = { items: { order: ServiceOrder; patientName: string; patientCode: string }[]; page: number; pageSize: number; total: number }
export type ClinicalAttachment = { id: number; medicalRecordId: number; orderId: number | null; fileName: string;
  contentType: string; fileSize: number; uploadedAt: string; downloadable: boolean }
export type ClinicalAttachmentPage = { items: ClinicalAttachment[]; page: number; pageSize: number; total: number }
