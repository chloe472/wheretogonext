import mongoose from 'mongoose';

const itineraryEngagementSchema = new mongoose.Schema(
  {
    itineraryId: { type: String, required: true, unique: true, index: true },
    destination: { type: String, default: '' },
    viewCount: { type: Number, default: 0 },
    viewerKeys: { type: [String], default: [] }, // unique users/browsers
  },
  { timestamps: true }
);

export default mongoose.model('ItineraryEngagement', itineraryEngagementSchema);

