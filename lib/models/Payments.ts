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

    mpPaymentId: { type: String, required: true },
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

PaymentSchema.index({ mpPaymentId: 1 }, { unique: true });

export const Payment =
  models.Payment || model('Payment', PaymentSchema);
