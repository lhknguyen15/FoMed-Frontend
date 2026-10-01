export type DoctorReportRow = {
  doctorId: number
  doctorName: string
  appointmentCount: number
  completedCount: number
  noShowCount: number
  invoicedAmount: number
  collectedAmount: number
}

export type ReportSummary = {
  from: string
  to: string
  totalAppointments: number
  completedAppointments: number
  noShowAppointments: number
  cancelledAppointments: number
  invoicedAmount: number
  collectedAmount: number
  outstandingAmount: number
  doctors: DoctorReportRow[]
}
