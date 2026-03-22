import { Router } from 'express';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Itinerary from '../models/Itinerary.js';
import Friendship from '../models/Friendship.js';
import { optionalAuth, requireAuth } from '../middleware/auth.js';

const router = Router();

function serializeUser(user, { includeEmail = false } = {}) {
  return {
    id: String(user._id),
    name: user.name || '',
    username: user.username || '',
    picture: user.picture || '',
    ...(includeEmail ? { email: user.email || '' } : {}),
  };
}

function mapTrip(doc) {
  return {
    id: String(doc._id),
    title: doc.title || '',
    destination: doc.destination || '',
    locations: doc.locations || '',
    startDate: doc.startDate || '',
    endDate: doc.endDate || '',
    dates: doc.dates || '',
    image: doc.image || '',
    status: doc.status || 'Planning',
    published: Boolean(doc.published),
    visibility: doc.visibility || 'private',
    updatedAt: doc.updatedAt || doc.createdAt || null,
  };
}

function countCountries(trips) {
  const unique = new Set();
  trips.forEach((t) => {
    const label = String(t.destination || t.locations || '').trim().toLowerCase();
    if (label) unique.add(label);
  });
  return unique.size;
}

function sortFriendPair(a, b) {
  return String(a) < String(b) ? [a, b] : [b, a];
}

async function findFriendshipId(userId, otherId) {
  const [userA, userB] = sortFriendPair(userId, otherId);
  return Friendship.findOne({ userA, userB }).select('_id').lean();
}

async function loadFriends(userId) {
  const rows = await Friendship.find({
    $or: [{ userA: userId }, { userB: userId }],
  })
    .select('userA userB')
    .lean();
  if (rows.length === 0) return [];
  const friendIds = rows.map((row) => {
    const a = String(row.userA);
    const b = String(row.userB);
    return a === String(userId) ? b : a;
  });
  const uniqueIds = Array.from(new Set(friendIds));
  const friends = await User.find({ _id: { $in: uniqueIds } })
    .select('name username picture email')
    .lean();
  return friends.map((friend) => ({
    id: String(friend._id),
    name: friend.name || '',
    username: friend.username || '',
    picture: friend.picture || '',
  }));
}

async function buildProfile({ userId, includePrivateTrips, includeEmail, viewerId }) {
  const user = await User.findById(userId).lean();
  if (!user) return null;

  const tripQuery = { creator: user._id };
  if (!includePrivateTrips) {
    tripQuery.published = true;
    tripQuery.visibility = 'public';
  }

  const tripDocs = await Itinerary.find(tripQuery)
    .select('title destination locations startDate endDate dates image status published visibility updatedAt createdAt')
    .sort({ updatedAt: -1 })
    .lean();

  const trips = tripDocs.map(mapTrip);
  const countries = countCountries(trips);
  const friends = await loadFriends(user._id);
  const isFriend = viewerId
    ? Boolean(await findFriendshipId(user._id, viewerId))
    : false;

  return {
    profile: serializeUser(user, { includeEmail }),
    stats: {
      countries,
      trips: trips.length,
      friends: friends.length,
    },
    trips,
    friends,
    viewer: {
      isFriend,
    },
  };
}

router.get('/me', requireAuth, async (req, res) => {
  try {
    const payload = await buildProfile({
      userId: req.userId,
      includePrivateTrips: true,
      includeEmail: true,
      viewerId: req.userId,
    });
    if (!payload) return res.status(404).json({ error: 'User not found' });
    return res.json(payload);
  } catch (err) {
    console.error('Profile me error:', err);
    return res.status(500).json({ error: 'Failed to load profile' });
  }
});

router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid user id' });
    }
    const isSelf = req.userId && String(req.userId) === String(id);
    const payload = await buildProfile({
      userId: id,
      includePrivateTrips: isSelf,
      includeEmail: isSelf,
      viewerId: req.userId || null,
    });
    if (!payload) return res.status(404).json({ error: 'User not found' });
    return res.json(payload);
  } catch (err) {
    console.error('Profile error:', err);
    return res.status(500).json({ error: 'Failed to load profile' });
  }
});

router.put('/me', requireAuth, async (req, res) => {
  try {
    const { name, username, picture } = req.body || {};
    const updates = {};
    if (name !== undefined) updates.name = String(name).trim();
    if (picture !== undefined) updates.picture = String(picture).trim();
    if (username !== undefined) {
      const next = String(username).trim().toLowerCase();
      if (next && !/^[a-z0-9._-]{3,20}$/.test(next)) {
        return res.status(400).json({ error: 'Username must be 3-20 characters (a-z, 0-9, . _ -).' });
      }
      updates.username = next || undefined;
    }
    if (updates.username) {
      const existing = await User.findOne({ username: updates.username, _id: { $ne: req.userId } }).lean();
      if (existing) return res.status(409).json({ error: 'Username is already taken.' });
    }
    const updated = await User.findByIdAndUpdate(req.userId, updates, { new: true }).lean();
    if (!updated) return res.status(404).json({ error: 'User not found' });
    return res.json({ profile: serializeUser(updated, { includeEmail: true }) });
  } catch (err) {
    console.error('Profile update error:', err);
    return res.status(500).json({ error: 'Failed to update profile' });
  }
});

router.post('/:id/friends', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid user id' });
    }
    if (String(id) === String(req.userId)) {
      return res.status(400).json({ error: 'You cannot add yourself.' });
    }
    const target = await User.findById(id).lean();
    if (!target) return res.status(404).json({ error: 'User not found' });

    const [userA, userB] = sortFriendPair(req.userId, id);
    await Friendship.updateOne(
      { userA, userB },
      { $setOnInsert: { userA, userB } },
      { upsert: true }
    );
    return res.status(201).json({ ok: true });
  } catch (err) {
    console.error('Add friend error:', err);
    return res.status(500).json({ error: 'Failed to add friend' });
  }
});

router.delete('/:id/friends', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid user id' });
    }
    if (String(id) === String(req.userId)) {
      return res.status(400).json({ error: 'You cannot remove yourself.' });
    }
    const [userA, userB] = sortFriendPair(req.userId, id);
    await Friendship.deleteOne({ userA, userB });
    return res.json({ ok: true });
  } catch (err) {
    console.error('Remove friend error:', err);
    return res.status(500).json({ error: 'Failed to remove friend' });
  }
});

export default router;
