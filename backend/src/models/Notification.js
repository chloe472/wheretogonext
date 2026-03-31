import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    type: {
      type: String,
      enum: [
        'itinerary_added',
        'friend_request_received',
        'itinerary_updated',
        'friend_request_accepted',
        'itinerary_commented',
      ],
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    message: { type: String, default: '', trim: true },
    link: { type: String, default: '', trim: true },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
    readAt: { type: Date, default: null },
  },
  { timestamps: true }
);

notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, readAt: 1, createdAt: -1 });

export default mongoose.model('Notification', notificationSchema);
