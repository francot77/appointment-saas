import { Schema, model, models } from 'mongoose';

const TemplateSchema = new Schema({
  event: { type: String, enum: ['confirmed', 'rescheduled', 'reminder'], required: true },
  name: { type: String, required: true },
  language: { type: String, enum: ['es_AR'], required: true },
  status: { type: String, enum: ['APPROVED', 'PENDING', 'REJECTED'], required: true },
  category: { type: String, enum: ['UTILITY'], default: 'UTILITY', required: true },
}, { _id: false });

const SecretEnvelopeSchema = new Schema({
  version: { type: String, enum: ['v1'], required: true },
  algorithm: { type: String, enum: ['aes-256-gcm'], required: true },
  keyId: { type: String, required: true },
  iv: { type: String, required: true },
  authTag: { type: String, required: true },
  ciphertext: { type: String, required: true },
}, { _id: false });

const MessagingConnectionSchema = new Schema({
  businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true },
  provider: { type: String, enum: ['meta_whatsapp_cloud'], required: true, default: 'meta_whatsapp_cloud' },
  phoneNumberId: { type: String, required: true },
  wabaId: { type: String, required: true },
  enabled: { type: Boolean, default: false, required: true },
  accessTokenEnvelope: { type: SecretEnvelopeSchema, required: true },
  appSecretEnvelope: { type: SecretEnvelopeSchema, default: null },
  verificationTokenEnvelope: { type: SecretEnvelopeSchema, default: null },
  templates: { type: [TemplateSchema], default: [] },
  leadTimeMinutes: { type: Number, min: 0, max: 10080, default: 60 },
}, { timestamps: true });

MessagingConnectionSchema.index({ businessId: 1 }, { unique: true });
MessagingConnectionSchema.index({ provider: 1, phoneNumberId: 1 }, { unique: true });

export const MessagingConnection = models.MessagingConnection || model('MessagingConnection', MessagingConnectionSchema);
