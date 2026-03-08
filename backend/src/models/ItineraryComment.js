import mongoose from 'mongoose';

const replySchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    userId: { type: String, required: true },
    userName: { type: String, required: true },
    userPicture: { type: String, default: '' },
    body: { type: String, required: true },
    likes: { type: [String], default: [] }, // userIds
    createdAt: { type: Date, default: () => new Date() },
  },
  { _id: false }
);

const itineraryCommentSchema = new mongoose.Schema(
  {
    itineraryId: { type: String, required: true, index: true },
    destination: { type: String, default: '' },
    userId: { type: String, required: true },
    userName: { type: String, required: true },
    userPicture: { type: String, default: '' },
    body: { type: String, required: true },
    likes: { type: [String], default: [] }, // userIds
    replies: { type: [replySchema], default: [] },
  },
  { timestamps: true }
);

itineraryCommentSchema.index({ itineraryId: 1, createdAt: -1 });

export default mongoose.model('ItineraryComment', itineraryCommentSchema);

