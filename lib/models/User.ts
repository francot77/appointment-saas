import { Schema, model, models } from 'mongoose';

const UserSchema = new Schema(
  {
    email: { type: String, required: true, unique: true },
    name: { type: String },
    passwordHash: { type: String, required: true }, // bcrypt
  },
  { timestamps: true }
);

export const User = models.User || model('User', UserSchema);
