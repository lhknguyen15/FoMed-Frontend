export type AuditLog = {
  auditLogId: number
  userId?: number | null
  username?: string | null
  action: string
  entity: string
  entityId?: number | null
  oldValue?: string | null
  newValue?: string | null
  createdAt: string
}

export type AuditLogPage = { items: AuditLog[]; total: number; page: number; pageSize: number }
