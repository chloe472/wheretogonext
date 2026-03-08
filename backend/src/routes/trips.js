import express from 'express';
import mongoose from 'mongoose';
import Trip from '../models/Trip.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

function safeTrim(value, max = 500) {
  return String(value || '').trim().slice(0, max);
}

function requireDb(req, res, next) {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ error: 'Database unavailable' });
  }
  return next();
}

function normalizeTripPayload(body = {}) {
  const payload = body && typeof body === 'object' ? body : {};
  return {
    title: safeTrim(payload.title, 140),
    destination: safeTrim(payload.destination, 140),
    locations: safeTrim(payload.locations, 220),
    startDate: safeTrim(payload.startDate, 20),
    endDate: safeTrim(payload.endDate, 20),
    dates: safeTrim(payload.dates, 80),

    placesSaved: Number(payload.placesSaved || 0),
    budget: safeTrim(payload.budget, 40) || '$0',
    budgetSpent: Number(payload.budgetSpent || 0),
    travelers: Math.max(1, Number(payload.travelers || 1)),
    status: safeTrim(payload.status, 40) || 'Planning',
    statusClass: safeTrim(payload.statusClass, 80) || 'trip-card__status--planning',
    image: safeTrim(payload.image, 800),

    tripExpenseItems: Array.isArray(payload.tripExpenseItems) ? payload.tripExpenseItems : [],
    sourceItineraryId: safeTrim(payload.sourceItineraryId, 220),
  };
}

router.get('/', requireAuth, requireDb, async (req, res) => {
  try {
    const userId = req.user?.id;
    const trips = await Trip.find({ userId })
      .sort({ updatedAt: -1 })
      .lean();
    return res.json({ trips });
  } catch {
    return res.status(500).json({ error: 'Failed to load trips' });
  }
});

router.post('/', requireAuth, requireDb, async (req, res) => {
  try {
    const userId = req.user?.id;
    const payload = normalizeTripPayload(req.body);
    const trip = await Trip.create({
      userId,
      ...payload,
    });
    return res.status(201).json({ trip: trip.toObject() });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to create trip' });
  }
});

router.get('/:tripId', requireAuth, requireDb, async (req, res) => {
  try {
    const userId = req.user?.id;
    const tripId = String(req.params.tripId || '').trim();
    if (!tripId) return res.status(400).json({ error: 'Missing tripId' });

    const trip = await Trip.findOne({ _id: tripId, userId }).lean();
    if (!trip) return res.status(404).json({ error: 'Trip not found' });
    return res.json({ trip });
  } catch {
    return res.status(500).json({ error: 'Failed to load trip' });
  }
});

router.patch('/:tripId', requireAuth, requireDb, async (req, res) => {
  try {
    const userId = req.user?.id;
    const tripId = String(req.params.tripId || '').trim();
    if (!tripId) return res.status(400).json({ error: 'Missing tripId' });

    const payload = normalizeTripPayload({ ...req.body });
    // Only apply keys that were actually provided.
    const update = {};
    Object.keys(payload).forEach((k) => {
      if (Object.prototype.hasOwnProperty.call(req.body || {}, k)) update[k] = payload[k];
    });

    const trip = await Trip.findOneAndUpdate(
      { _id: tripId, userId },
      { $set: update },
      { new: true }
    ).lean();

    if (!trip) return res.status(404).json({ error: 'Trip not found' });
    return res.json({ trip });
  } catch {
    return res.status(500).json({ error: 'Failed to update trip' });
  }
});

router.delete('/:tripId', requireAuth, requireDb, async (req, res) => {
  try {
    const userId = req.user?.id;
    const tripId = String(req.params.tripId || '').trim();
    if (!tripId) return res.status(400).json({ error: 'Missing tripId' });

    const result = await Trip.deleteOne({ _id: tripId, userId });
    if (result.deletedCount === 0) return res.status(404).json({ error: 'Trip not found' });
    return res.json({ ok: true });
  } catch {
    return res.status(500).json({ error: 'Failed to delete trip' });
  }
});

export default router;

