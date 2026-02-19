import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    googleId: { type: String, required: true, unique: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    name: { type: String, trim: true },
    picture: { type: String },
  },
  { timestamps: true }
);

userSchema.index({ googleId: 1 });

export default mongoose.model('User', userSchema);
