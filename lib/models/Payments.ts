import { Schema, model, models } from 'mongoose';

const PaymentSchema = new Schema(
  {
    businessId: {
      type: Schema.Types.ObjectId,
      ref: 'Business',
      required: true,
    },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'ARS' },

    method: {
      type: String,
      enum: ['mp', 'mp_card', 'mp_other'],
      default: 'mp',
    },

    mpPaymentId: { type: String, default: null },
    preferenceId: { type: String, default: null },
    attemptReference: { type: String, required: true },
    productVersion: { type: String, required: true, default: 'v1' },
    periodMonths: { type: Number, required: true, default: 1 },
    status: {
      type: String,
      enum: ['approved', 'pending', 'rejected'],
      required: true,
    },

    periodFrom: { type: Date, required: true },
    periodTo: { type: Date, required: true },

    productId: { type: String, required: true },
    providerStatus: { type: String, required: true },
    statusDetail: { type: String, default: null },
  },
  { timestamps: true }
);

PaymentSchema.index({ mpPaymentId: 1 }, { unique: true, sparse: true });
PaymentSchema.index({ preferenceId: 1 }, { unique: true, sparse: true });
PaymentSchema.index({ businessId: 1, attemptReference: 1 }, { unique: true });

export const Payment =
  models.Payment || model('Payment', PaymentSchema);
