// lib/models/ScheduleDay.ts
import { Schema, models, model } from 'mongoose';

const BlockSchema = new Schema(
  {
    start: { type: String, required: true }, // 'HH:MM'
    end:   { type: String, required: true }, // 'HH:MM'
    enabled: { type: Boolean, default: true },
  },
  { _id: false }
);

const ScheduleDaySchema = new Schema(
  {
    businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true }, // 🔴 nuevo
    // 0 = domingo ... 6 = sábado
    weekday: { type: Number, required: true },
    blocks: { type: [BlockSchema], default: [] },
  },
  { timestamps: true }
);

// un día por negocio
ScheduleDaySchema.index(
  { businessId: 1, weekday: 1 },
  { unique: true }
);

export const ScheduleDay =
  models.ScheduleDay || model('ScheduleDay', ScheduleDaySchema);
