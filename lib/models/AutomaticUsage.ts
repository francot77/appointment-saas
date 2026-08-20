import { Schema, model, models } from 'mongoose';

export const AUTOMATIC_USAGE_STATES = ['reserved', 'accepted', 'uncertain', 'released'] as const;

const AllocationSchema = new Schema(
  {
    jobKey: { type: String, required: true },
    jobId: { type: Schema.Types.ObjectId, ref: 'MessageJob', required: true },
    state: { type: String, enum: AUTOMATIC_USAGE_STATES, required: true },
    reservedAt: { type: Date, required: true },
    resolvedAt: { type: Date, default: null },
    providerMessageId: { type: String, default: null },
    reconcilerId: { type: String, default: null },
    reconciliationReason: { type: String, default: null },
    reconciliationEvidenceRef: { type: String, default: null },
    reconciledAt: { type: Date, default: null },
  },
  { _id: false }
);

const AutomaticUsageSchema = new Schema(
  {
    businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true },
    periodKey: { type: String, required: true, match: /^\d{4}-(0[1-9]|1[0-2])$/ },
    timezone: { type: String, required: true },
    acceptedCount: { type: Number, required: true, min: 0, default: 0 },
    allocations: { type: [AllocationSchema], default: [] },
  },
  { timestamps: true }
);

AutomaticUsageSchema.index({ businessId: 1, periodKey: 1 }, { unique: true });
AutomaticUsageSchema.index({ businessId: 1, 'allocations.jobKey': 1 });

export const AutomaticUsage =
  models.AutomaticUsage || model('AutomaticUsage', AutomaticUsageSchema);
