import mongoose from 'mongoose';
import { ALL_ROLES, ROLES } from '../../../constants/roles.js';

const userSchema = new mongoose.Schema(
  {
    first_name: { type: String, required: true, trim: true },
    last_name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    age: { type: Number, min: 0 },
    password: { type: String, required: true },
    cart: { type: mongoose.Schema.Types.ObjectId, ref: 'carts' },
    role: { type: String, enum: ALL_ROLES, default: ROLES.USER },
    last_connection: { type: Date },
  },
  { timestamps: true, versionKey: false },
);

export const UserModel = mongoose.model('users', userSchema);
