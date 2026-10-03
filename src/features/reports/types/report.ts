export type DoctorReportRow = {
  doctorId: number
  doctorName: string
  appointmentCount: number
  completedCount: number
  noShowCount: number
  cancelledCount?: number
  noShowRatePercent?: number
  invoicedAmount: number
  collectedAmount: number
  outstandingAmount: number
}

export type ReportSummary = {
  from: string
  to: string
  totalAppointments: number
  completedAppointments: number
  noShowAppointments: number
  cancelledAppointments: number
  noShowRatePercent?: number
  invoicedAmount: number
  collectedAmount: number
  outstandingAmount: number
  doctors: DoctorReportRow[]
}
