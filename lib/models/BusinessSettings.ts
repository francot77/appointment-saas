// lib/models/BusinessSettings.ts
import { Schema, model, models } from 'mongoose';

const BusinessSettingsSchema = new Schema(
  {
    businessId: {
      type: Schema.Types.ObjectId,
      ref: 'Business',
      required: true,
      unique: true,
    },

    // Nombre público (puede diferir del interno)
    publicName: { type: String },

    // Branding básico
    primaryColor: { type: String, default: '#38bdf8' },   // brand SaaS / acento
    secondaryColor: { type: String, default: '#facc15' },
    textColor: { type: String, default: '#f9fafb' },

    // Fondo de la landing pública
    backgroundType: {
      type: String,
      enum: ['solid', 'gradient', 'image'],
      default: 'gradient',
    },
    backgroundColor: { type: String, default: '#020617' },
    gradientFrom: { type: String, default: '#020617' },
    gradientTo: { type: String, default: '#0f172a' },
    backgroundImageUrl: { type: String, default: '' },

    // Logo / avatar
    logoUrl: { type: String, default: '' },

    // Contenido de la landing de turnos
    heroTitle: { type: String, default: '' },
    heroSubtitle: { type: String, default: '' },
    ctaLabel: { type: String, default: 'Reservar turno' },

    // Texto “sobre mí / nosotros”
    aboutEnabled: { type: Boolean, default: false },
    aboutTitle: { type: String, default: '' },
    aboutText: { type: String, default: '' },

    // Redes básicas (para mostrar iconos clickeables)
    whatsappNumber: { type: String, default: '' },
    instagramHandle: { type: String, default: '' },
    address: { type: String, default: '' },
  },
  { timestamps: true }
);

export const BusinessSettings =
  models.BusinessSettings || model('BusinessSettings', BusinessSettingsSchema);
