import mongoose from 'mongoose';

const attachmentSchema = new mongoose.Schema(
  {
    id: { type: String, default: '' },
    name: { type: String, default: '' },
    size: { type: Number, default: 0 },
    type: { type: String, default: '' },
  },
  { _id: false }
);

const tripItemSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    name: { type: String, default: '' },
    total: { type: Number, default: 0 },
    categoryId: { type: String, default: '' },
    category: { type: String, default: '' },
    date: { type: String, default: '' }, // YYYY-MM-DD
    detail: { type: String, default: '' },
    lat: { type: Number, default: null },
    lng: { type: Number, default: null },
    notes: { type: String, default: '' },
    attachments: { type: [attachmentSchema], default: [] },
    startTime: { type: String, default: '07:00' },
    durationHrs: { type: Number, default: 0 },
    durationMins: { type: Number, default: 0 },
    externalLink: { type: String, default: '' },
    placeImageUrl: { type: String, default: '' },
    rating: { type: Number, default: null },
    reviewCount: { type: Number, default: null },
  },
  { _id: false }
);

const tripSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    title: { type: String, default: '' },
    destination: { type: String, default: '' },
    locations: { type: String, default: '' },
    startDate: { type: String, default: '' }, // YYYY-MM-DD
    endDate: { type: String, default: '' }, // YYYY-MM-DD
    dates: { type: String, default: '' },

    placesSaved: { type: Number, default: 0 },
    budget: { type: String, default: '$0' },
    budgetSpent: { type: Number, default: 0 },
    travelers: { type: Number, default: 1 },
    status: { type: String, default: 'Planning' },
    statusClass: { type: String, default: 'trip-card__status--planning' },
    image: { type: String, default: '' },

    tripExpenseItems: { type: [tripItemSchema], default: [] },

    sourceItineraryId: { type: String, default: '' }, // if cloned from community itinerary
  },
  { timestamps: true }
);

tripSchema.index({ userId: 1, updatedAt: -1 });

export default mongoose.model('Trip', tripSchema);

