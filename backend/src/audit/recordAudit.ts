import { Types } from 'mongoose';
import { AuditLog } from '../models/AuditLog';
import { UserRole } from '../models/User';

interface RecordAuditParams {
  actor: Types.ObjectId | string;
  actorRole: UserRole;
  action: string;
  entityType: string;
  entityId: Types.ObjectId | string;
  before?: unknown;
  after?: unknown;
}

export async function recordAudit(params: RecordAuditParams): Promise<void> {
  await AuditLog.create({
    actor: params.actor,
    actorRole: params.actorRole,
    action: params.action,
    entityType: params.entityType,
    entityId: params.entityId,
    before: params.before,
    after: params.after,
  });
}
