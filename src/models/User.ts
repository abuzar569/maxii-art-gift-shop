import mongoose, { Schema } from 'mongoose';

const UserSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'staff'], default: 'admin' },
  },
  { timestamps: true }
);

export interface IUser {
  _id: string;
  email: string;
  password: string;
  role: string;
}

const User = mongoose.models.User || mongoose.model('User', UserSchema);

export default User;
