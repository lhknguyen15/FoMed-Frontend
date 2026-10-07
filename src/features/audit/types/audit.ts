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
  fullName?: string | null
  roles?: string[]
  actorSnapshot?: boolean
  source?: string | null
  ipAddress?: string | null
  requestId?: string | null
  changedFields?: string[]
}

export type AuditLogPage = { items: AuditLog[]; total: number; page: number; pageSize: number }
