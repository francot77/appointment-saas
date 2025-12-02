import { Schema, model, models } from 'mongoose';

const BusinessSchema = new Schema(
  {
    ownerUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    industry: { type: String, default: 'peluqueria' }, 
    phone: { type: String },
    address: { type: String },
    slug: { type: String, required: true, unique: true }, 
    settings: {
      workDays: { type: [Number], default: [1, 2, 3, 4, 5, 6] },
      workHours: {
        start: { type: String, default: '09:00' },
        end: { type: String, default: '19:00' },
      },
      slotSizeMinutes: { type: Number, default: 30 },
    },plan: {
      type: String,
      enum: ['basic'],
      default: 'basic',
    },
    status: {
      type: String,
      enum: ['trial', 'active', 'past_due', 'cancelled'],
      default: 'trial',
    },
    paidUntil: {
      type: Date,
      default: null,
    },
    mpPreapprovalId: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

BusinessSchema.index({ ownerUserId: 1 });

export const Business = models.Business || model('Business', BusinessSchema);
