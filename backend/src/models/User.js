import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    googleId: { type: String, default: undefined },
    email: { type: String, required: true, trim: true, lowercase: true, unique: true },
    username: { type: String, trim: true, default: undefined },
    password: { type: String },
    name: { type: String, trim: true },
    picture: { type: String },
    intro: { type: String, trim: true, default: '' },
    interests: { type: [String], default: [] },
    nationality: { type: String, trim: true, default: '' },
    socials: {
      type: [
        {
          platform: { type: String, trim: true, default: '' },
          url: { type: String, trim: true, default: '' },
          handle: { type: String, trim: true, default: '' },
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
);

// Sparse unique index: multiple users can have no googleId (email/password signups)
userSchema.index({ googleId: 1 }, { unique: true, sparse: true });
userSchema.index({ username: 1 }, { unique: true, sparse: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  try {
    this.password = await bcrypt.hash(this.password, 10);
  } catch (e) {
    return next(e);
  }
  next();
});

export default mongoose.model('User', userSchema);
