import { Schema, model, models } from 'mongoose';

const SettingsSchema = new Schema(
  {
    owner: { type: String, default: 'hermana', unique: true },
    workDays: { type: [Number], default: [1, 2, 3, 4, 5, 6] }, // lunes-sábado
    workHours: {
      start: { type: String, default: '09:00' },
      end: { type: String, default: '19:00' },
    },
    slotSizeMinutes: { type: Number, default: 15 },
  },
  { timestamps: true }
);

export const Settings =
  models.Settings || model('Settings', SettingsSchema);
