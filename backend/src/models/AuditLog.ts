import { Schema, model, Types } from 'mongoose';

export interface IAuditLog {
  _id: Types.ObjectId;
  actor: Types.ObjectId;
  actorRole: string;
  action: string;
  entityType: string;
  entityId: Types.ObjectId;
  before?: unknown;
  after?: unknown;
  createdAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    actor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    actorRole: { type: String, required: true },
    action: { type: String, required: true },
    entityType: { type: String, required: true },
    entityId: { type: Schema.Types.ObjectId, required: true },
    before: { type: Schema.Types.Mixed },
    after: { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ entityType: 1, entityId: 1 });

export const AuditLog = model<IAuditLog>('AuditLog', auditLogSchema);
