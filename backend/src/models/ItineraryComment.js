import mongoose from 'mongoose';

const itineraryCommentSchema = new mongoose.Schema(
  {
    itineraryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Itinerary', required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    userName: { type: String, default: '' },
    body: { type: String, required: true, trim: true, maxlength: 8000 },
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'ItineraryComment', default: null },
    likes: { type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], default: [] },
  },
  { timestamps: true }
);

itineraryCommentSchema.index({ itineraryId: 1, createdAt: 1 });

export default mongoose.model('ItineraryComment', itineraryCommentSchema);
