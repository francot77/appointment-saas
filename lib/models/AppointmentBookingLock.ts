import { Schema, model, models } from 'mongoose';

const AppointmentBookingLockSchema = new Schema(
  {
    key: { type: String, required: true, unique: true },
    token: { type: String, required: true },
    // Kept for compatibility with existing lease documents; active locks are transaction-scoped.
    expiresAt: { type: Date, default: null },
  },
  { timestamps: true }
);

AppointmentBookingLockSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const AppointmentBookingLock =
  models.AppointmentBookingLock ||
  model('AppointmentBookingLock', AppointmentBookingLockSchema);
