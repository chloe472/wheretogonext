import mongoose from 'mongoose';

const imageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    reactions: { type: Map, of: Number, default: {} },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const folderSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    images: { type: [imageSchema], default: [] },
  },
  { _id: true }
);

const moodboardSchema = new mongoose.Schema(
  {
    tripId: { type: mongoose.Schema.Types.ObjectId, ref: 'Itinerary', required: true, index: true },
    folders: { type: [folderSchema], default: [] },
    creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export default mongoose.model('Moodboard', moodboardSchema);