import { Router } from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Itinerary from '../models/Itinerary.js';
import Friendship from '../models/Friendship.js';
import FriendRequest from '../models/FriendRequest.js';
import { optionalAuth, requireAuth } from '../middleware/auth.js';
import { createNotification } from '../services/notifications.js';

const router = Router();

const uploadDir = path.join(process.cwd(), 'uploads', 'profiles');
fs.mkdirSync(uploadDir, { recursive: true });

const profileStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const safeExt = ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg'].includes(ext) ? ext : '.jpg';
    cb(null, `${req.userId}-${Date.now()}-${Math.random().toString(36).slice(2, 11)}${safeExt}`);
  },
});

const PROFILE_IMAGE_MIME = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'image/svg+xml',
]);

const profileUpload = multer({
  storage: profileStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (PROFILE_IMAGE_MIME.has(file.mimetype)) return cb(null, true);
    cb(new Error('Invalid file type. Use SVG, PNG, JPG, WEBP, or GIF.'));
  },
});

function serializeUser(user, { includeEmail = false } = {}) {
  return {
    id: String(user._id),
    name: user.name || '',
    username: user.username || '',
    picture: user.picture || '',
    intro: user.intro || '',
    interests: Array.isArray(user.interests) ? user.interests : [],
    nationality: user.nationality || '',
    socials: Array.isArray(user.socials) ? user.socials : [],
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

async function findRequestStatus(userId, viewerId) {
  if (!viewerId) return { status: 'none' };
  const req = await FriendRequest.findOne({
    status: 'pending',
    $or: [
      { from: viewerId, to: userId },
      { from: userId, to: viewerId },
    ],
  })
    .select('from to')
    .lean();
  if (!req) return { status: 'none' };
  if (String(req.from) === String(viewerId)) return { status: 'outgoing' };
  return { status: 'incoming', requestId: String(req._id) };
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
  const isFriend = viewerId ? Boolean(await findFriendshipId(user._id, viewerId)) : false;
  const requestStatus = !isFriend && viewerId ? await findRequestStatus(user._id, viewerId) : { status: 'none' };

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
      requestStatus: requestStatus.status,
      requestId: requestStatus.requestId || null,
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
    const { name, username, picture, intro, interests, nationality, socials } = req.body || {};
    const updates = {};
    if (name !== undefined) updates.name = String(name).trim();
    if (picture !== undefined) updates.picture = String(picture).trim();
    if (intro !== undefined) updates.intro = String(intro).trim().slice(0, 400);
    if (nationality !== undefined) updates.nationality = String(nationality).trim().slice(0, 60);
    if (interests !== undefined) {
      const list = Array.isArray(interests)
        ? interests.map((x) => String(x).trim()).filter(Boolean)
        : String(interests || '')
          .split(',')
          .map((x) => x.trim())
          .filter(Boolean);
      updates.interests = list.slice(0, 10);
    }
    if (socials !== undefined) {
      const raw = Array.isArray(socials) ? socials : [];
      updates.socials = raw
        .map((s) => ({
          platform: String(s?.platform || '').trim(),
          url: String(s?.url || '').trim(),
          handle: String(s?.handle || '').trim(),
        }))
        .filter((s) => s.platform || s.url || s.handle)
        .slice(0, 8);
    }
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

router.post('/me/photo', requireAuth, profileUpload.single('photo'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No photo uploaded.' });
    const relative = `/uploads/profiles/${req.file.filename}`;
    const updated = await User.findByIdAndUpdate(
      req.userId,
      { picture: relative },
      { new: true }
    ).lean();
    if (!updated) return res.status(404).json({ error: 'User not found' });
    return res.json({ profile: serializeUser(updated, { includeEmail: true }) });
  } catch (err) {
    console.error('Profile photo error:', err);
    return res.status(500).json({ error: 'Failed to upload photo' });
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
    const existingFriend = await Friendship.findOne({ userA, userB }).lean();
    if (existingFriend) return res.status(200).json({ ok: true });

    const upsertResult = await FriendRequest.updateOne(
      { from: req.userId, to: id },
      { $setOnInsert: { from: req.userId, to: id, status: 'pending' } },
      { upsert: true }
    );

    if (Number(upsertResult?.upsertedCount || 0) > 0) {
      await createNotification({
        recipientId: id,
        actorId: req.userId,
        type: 'friend_request_received',
        title: 'New friend request',
        message: `${req.user?.name || req.user?.username || req.user?.email || 'Someone'} sent you a friend request.`,
        link: '/profile?tab=friends&section=requests',
        meta: { fromUserId: String(req.userId) },
      });
    }

    return res.status(201).json({ ok: true, status: 'pending' });
  } catch (err) {
    console.error('Add friend error:', err);
    return res.status(500).json({ error: 'Failed to send friend request' });
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
    await FriendRequest.deleteOne({
      $or: [
        { from: req.userId, to: id },
        { from: id, to: req.userId },
      ],
    });
    return res.json({ ok: true });
  } catch (err) {
    console.error('Remove friend error:', err);
    return res.status(500).json({ error: 'Failed to remove friend' });
  }
});

router.get('/requests', requireAuth, async (req, res) => {
  try {
    const rows = await FriendRequest.find({ to: req.userId, status: 'pending' })
      .populate('from', 'name username picture')
      .sort({ createdAt: -1 })
      .lean();
    const requests = rows.map((r) => ({
      id: String(r._id),
      from: {
        id: String(r.from?._id || ''),
        name: r.from?.name || '',
        username: r.from?.username || '',
        picture: r.from?.picture || '',
      },
      createdAt: r.createdAt,
    }));
    return res.json({ requests });
  } catch (err) {
    console.error('List requests error:', err);
    return res.status(500).json({ error: 'Failed to load friend requests' });
  }
});

router.get('/requests/outgoing', requireAuth, async (req, res) => {
  try {
    const rows = await FriendRequest.find({ from: req.userId, status: 'pending' })
      .populate('to', 'name username picture')
      .sort({ createdAt: -1 })
      .lean();
    const requests = rows.map((r) => ({
      id: String(r._id),
      to: {
        id: String(r.to?._id || ''),
        name: r.to?.name || '',
        username: r.to?.username || '',
        picture: r.to?.picture || '',
      },
      createdAt: r.createdAt,
    }));
    return res.json({ requests });
  } catch (err) {
    console.error('Outgoing requests error:', err);
    return res.status(500).json({ error: 'Failed to load outgoing requests' });
  }
});

router.post('/requests/:id/accept', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid request id' });
    }
    const reqDoc = await FriendRequest.findById(id).lean();
    if (!reqDoc || String(reqDoc.to) !== String(req.userId)) {
      return res.status(404).json({ error: 'Request not found' });
    }
    const [userA, userB] = sortFriendPair(reqDoc.from, reqDoc.to);
    await Friendship.updateOne(
      { userA, userB },
      { $setOnInsert: { userA, userB } },
      { upsert: true }
    );

    const accepter = await User.findById(req.userId).select('name username email').lean();
    await createNotification({
      recipientId: String(reqDoc.from),
      actorId: req.userId,
      type: 'friend_request_accepted',
      title: 'Friend request accepted',
      message: `${accepter?.name || accepter?.username || accepter?.email || 'Someone'} accepted your friend request.`,
      link: '/profile?tab=friends&section=friends',
      meta: { acceptedByUserId: String(req.userId) },
    });

    await FriendRequest.deleteOne({ _id: id });
    return res.json({ ok: true });
  } catch (err) {
    console.error('Accept request error:', err);
    return res.status(500).json({ error: 'Failed to accept request' });
  }
});

router.delete('/requests/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid request id' });
    }
    const reqDoc = await FriendRequest.findById(id).lean();
    if (!reqDoc || (String(reqDoc.to) !== String(req.userId) && String(reqDoc.from) !== String(req.userId))) {
      return res.status(404).json({ error: 'Request not found' });
    }
    await FriendRequest.deleteOne({ _id: id });
    return res.json({ ok: true });
  } catch (err) {
    console.error('Delete request error:', err);
    return res.status(500).json({ error: 'Failed to remove request' });
  }
});

export default router;
