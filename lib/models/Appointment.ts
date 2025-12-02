import { Schema, model, models } from 'mongoose';

const AppointmentSchema = new Schema(
  {
    businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true },

    clientName: { type: String, required: true },
    clientPhone: { type: String, required: true },
    serviceId: { type: Schema.Types.ObjectId, ref: 'Service', required: true },
    date: { type: String, required: true },      // "YYYY-MM-DD"
    startTime: { type: String, required: true }, // "HH:mm"
    endTime: { type: String, required: true },   // "HH:mm"
    status: {
      type: String,
      enum: ['request', 'confirmed', 'cancelled', 'rejected'],
      default: 'request',
    },
    notes: { type: String },
    reminderSent: { type: Boolean, default: false },
    lastReminderAt: { type: Date },

    // para reprogramar vía magic link
    rescheduleToken: { type: String, default: null },
    rescheduleTokenExpiresAt: { type: Date, default: null },
    clientToken: { type: String, index: true },
    clientTokenExpiresAt: { type: Date },
  },
  { timestamps: true }
);

// índices ahora incluyen businessId
AppointmentSchema.index({ businessId: 1, date: 1, status: 1, startTime: 1 });
AppointmentSchema.index({ businessId: 1, clientPhone: 1 });

export const Appointment =
  models.Appointment || model('Appointment', AppointmentSchema);
