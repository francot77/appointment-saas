import { Schema, model, models } from 'mongoose';

const ProviderWebhookEventSchema = new Schema({
  businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true },
  provider: { type: String, enum: ['meta_whatsapp_cloud'], required: true },
  eventId: { type: String, required: true },
  providerMessageId: { type: String, required: true },
  status: { type: String, enum: ['accepted', 'sent', 'delivered', 'read', 'failed'], required: true },
  processedAt: { type: Date, required: true },
}, { timestamps: true });

ProviderWebhookEventSchema.index({ businessId: 1, provider: 1, eventId: 1 }, { unique: true });
ProviderWebhookEventSchema.index({ businessId: 1, providerMessageId: 1 });

export const ProviderWebhookEvent = models.ProviderWebhookEvent || model('ProviderWebhookEvent', ProviderWebhookEventSchema);
