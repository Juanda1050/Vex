import type { Prisma } from "@prisma/client";

import { logError } from "@/lib/log-sanitizer";
import { prisma } from "@/lib/prisma";

export type AuditLogInput = {
  tenantId?: string | null;
  actorUserId?: string | null;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  metadata?: Prisma.InputJsonValue;
};

export async function writeAuditLog(input: AuditLogInput): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        tenantId: input.tenantId ?? null,
        actorUserId: input.actorUserId ?? null,
        action: input.action,
        resourceType: input.resourceType,
        resourceId: input.resourceId ?? null,
        metadata: input.metadata ?? {},
      },
    });
  } catch (error) {
    logError("Audit log write failed", error, {
      action: input.action,
      resourceType: input.resourceType,
    });
  }
}
