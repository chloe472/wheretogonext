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
    locations: { type: String, default: '', trim: true },
    
    citySegments: {
      type: [
        {
          city: { type: String, default: '', trim: true },
          locationLabel: { type: String, default: '', trim: true },
          startDay: { type: Number, default: 1, min: 1 },
          endDay: { type: Number, default: 1, min: 1 },
        },
      ],
      default: [],
    },
    startDate: { type: String, default: '' },
    endDate: { type: String, default: '' },
    dates: { type: String, default: '' },
    budget: { type: String, default: '$0' },
    budgetSpent: { type: Number, default: 0, min: 0 },
    travelers: { type: Number, default: 1, min: 1 },
    collaborators: {
      type: [
        {
          userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
          email: { type: String, default: '', trim: true },
          role: { type: String, default: 'editor', trim: true },
        },
      ],
      default: [],
    },
    status: { type: String, default: 'Planning' },
    statusClass: { type: String, default: '' },
    image: { type: String, default: '' },
    placesSaved: { type: Number, default: 0, min: 0 },
    days: { type: Number, default: 1, min: 1 },
    categories: { type: [String], default: [] },
    coverImages: { type: [String], default: [] },
    tripExpenseItems: { type: [mongoose.Schema.Types.Mixed], default: [] },
    dayTitles: { type: mongoose.Schema.Types.Mixed, default: {} },
    generalNotes: { type: String, default: '' },
    generalAttachments: { type: [mongoose.Schema.Types.Mixed], default: [] },
    places: { type: [placeSchema], default: [] },
    viewCount: { type: Number, default: 0, min: 0 },
    published: { type: Boolean, default: false },
    visibility: { type: String, enum: ['public', 'private'], default: 'private' },
    publishedAt: { type: Date, default: null },
    customizedFromItineraryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Itinerary',
      default: null,
      index: true,
    },
  },
  { timestamps: true }
);

itinerarySchema.index({ creator: 1, updatedAt: -1 });
itinerarySchema.index({ creator: 1, customizedFromItineraryId: 1 });
itinerarySchema.index({ visibility: 1, published: 1, publishedAt: -1 });

export default mongoose.model('Itinerary', itinerarySchema);
