// lib/utils/audit.ts
import { prisma } from '@/lib/db/prisma'

interface AuditInput {
  userId?: string
  projectId?: string
  action: string
  entity: string
  entityId?: string
  oldValues?: Record<string, unknown>
  newValues?: Record<string, unknown>
  ipAddress?: string
}

export async function createAuditLog(input: AuditInput): Promise<void> {
  try {
    await prisma.auditLog.create({ data: input })
  } catch {
    // Audit log failures are non-fatal — never let them break main flow
    console.error('[AuditLog] Failed:', input.action, input.entity)
  }
}
