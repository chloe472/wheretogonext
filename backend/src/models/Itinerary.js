import mongoose from 'mongoose';

const placeSchema = new mongoose.Schema(
  {
    name: { type: String, default: '' },
    category: { type: String, default: '' },
    address: { type: String, default: '' },
    timeSlot: { type: String, default: '' },
    notes: { type: String, default: '' },
    image: { type: String, default: '' },
    rating: { type: Number, default: null },
    reviewCount: { type: Number, default: null },
    dayNumber: { type: Number, default: 1 },
    lat: { type: Number, default: null },
    lng: { type: Number, default: null },
  },
  { _id: false }
);

const itinerarySchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    overview: { type: String, default: '' },
    creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    destination: { type: String, default: '', trim: true },
    /** Multi-city / broader location label (e.g. "Paris, France"). */
    locations: { type: String, default: '', trim: true },
    /** Trip date range (YYYY-MM-DD) and human-readable label for cards. */
    startDate: { type: String, default: '' },
    endDate: { type: String, default: '' },
    dates: { type: String, default: '' },
    budget: { type: String, default: '$0' },
    budgetSpent: { type: Number, default: 0, min: 0 },
    travelers: { type: Number, default: 1, min: 1 },
    /** UI status e.g. Planning, Upcoming — mirrors legacy trip cards. */
    status: { type: String, default: 'Planning' },
    statusClass: { type: String, default: '' },
    /** Single hero image for trip cards (often same as coverImages[0]). */
    image: { type: String, default: '' },
    /** Count shown on dashboard; may differ from places.length during migration. */
    placesSaved: { type: Number, default: 0, min: 0 },
    /** Derived from unique day coverage / places; keep in sync when saving. */
    days: { type: Number, default: 1, min: 1 },
    categories: { type: [String], default: [] },
    coverImages: { type: [String], default: [] },
    /** Kanban/calendar line items (places, transport, etc.) — rich objects from TripDetailsPage. */
    tripExpenseItems: { type: [mongoose.Schema.Types.Mixed], default: [] },
    places: { type: [placeSchema], default: [] },
    viewCount: { type: Number, default: 0, min: 0 },
    published: { type: Boolean, default: false },
    visibility: { type: String, enum: ['public', 'private'], default: 'private' },
    publishedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

itinerarySchema.index({ creator: 1, updatedAt: -1 });
itinerarySchema.index({ visibility: 1, published: 1, publishedAt: -1 });

export default mongoose.model('Itinerary', itinerarySchema);
