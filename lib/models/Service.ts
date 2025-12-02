import { Schema, model, models } from 'mongoose';

const ServiceSchema = new Schema(
  {
    businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true }, // 🔴
    name: { type: String, required: true },
    durationMinutes: { type: Number, required: true },
    price: { type: Number, required: true },
    color: { type: String, default: '#f472b6' },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

ServiceSchema.index({ businessId: 1, name: 1 }, { unique: false });


export const Service = models.Service || model('Service', ServiceSchema);
