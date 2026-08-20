import { Schema, model, models } from 'mongoose';
import { MESSAGE_JOB_STATES } from '@/lib/messaging/domain';

export { MESSAGE_JOB_STATES };

const MessageJobSchema = new Schema(
  {
    businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true },
    appointmentId: { type: Schema.Types.ObjectId, ref: 'Appointment', required: true },
    event: { type: String, enum: ['confirmed', 'rescheduled', 'reminder'], required: true },
    occurrence: { type: String, required: true },
    recipient: { type: String, required: true },
    content: { type: Schema.Types.Mixed, required: true },
    scheduledAt: { type: Date, required: true },
    messagingVersion: { type: Number, required: true, min: 0 },
    idempotencyKey: { type: String, required: true },
    state: { type: String, enum: MESSAGE_JOB_STATES, default: 'scheduled', required: true },
    attempts: { type: Number, default: 0, min: 0 },
    leaseToken: { type: String, default: null },
    leaseExpiresAt: { type: Date, default: null },
    dispatchStartedAt: { type: Date, default: null },
    automatic: { type: Boolean, default: true },
    usagePeriodKey: { type: String, default: null },
    usageTimezone: { type: String, default: null },
    effectivePlan: { type: String, default: null },
    usageAllowance: { type: Number, default: null },
    usageOutcome: { type: String, enum: ['reserved', 'accepted', 'released', 'entitlement_denied', 'connection_blocked', 'quota_exceeded', 'delivery_unknown'], default: null },
    usageAccepted: { type: Number, default: null },
    usageUncertain: { type: Number, default: null },
    usageReservedAt: { type: Date, default: null },
    usageResolvedAt: { type: Date, default: null },
    failureCode: { type: String, default: null },
    provider: { type: String, enum: ['meta_whatsapp_cloud'], default: null },
    providerMessageId: { type: String, default: null },
    deliveryStatus: { type: String, enum: ['accepted', 'sent', 'delivered', 'read', 'failed'], default: null },
    statusUpdatedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

MessageJobSchema.index({ businessId: 1, idempotencyKey: 1 }, { unique: true });
MessageJobSchema.index({ businessId: 1, state: 1, scheduledAt: 1 });
MessageJobSchema.index({ businessId: 1, state: 1, leaseExpiresAt: 1 });
MessageJobSchema.index({ businessId: 1, providerMessageId: 1 }, { partialFilterExpression: { providerMessageId: { $type: 'string' } } });

export const MessageJob = models.MessageJob || model('MessageJob', MessageJobSchema);
