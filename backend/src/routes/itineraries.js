import { Router } from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import mongoose from 'mongoose';
import Itinerary from '../models/Itinerary.js';
import ItineraryComment from '../models/ItineraryComment.js';
import User from '../models/User.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';
import { createNotification, createNotifications } from '../services/notifications.js';

const router = Router();

const uploadDir = path.join(process.cwd(), 'uploads', 'itineraries');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const safeExt = ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg'].includes(ext) ? ext : '.jpg';
    cb(null, `${req.userId}-${Date.now()}-${Math.random().toString(36).slice(2, 11)}${safeExt}`);
  },
});

const ALLOWED_IMAGE_MIME = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'image/svg+xml',
]);

const uploadMw = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_IMAGE_MIME.has(file.mimetype)) return cb(null, true);
    cb(new Error('Invalid file type. Use SVG, PNG, JPG, WEBP, or GIF.'));
  },
});

// Prevent accidental double-counts from rapid duplicate requests (e.g., StrictMode/dev double-fetch).
const VIEW_DEDUPE_WINDOW_MS = 30 * 1000;
const recentViewHits = new Map();

function shouldCountView(req, itineraryId) {
  const ip = String(
    req.headers['x-forwarded-for']
      || req.socket?.remoteAddress
      || req.ip
      || ''
  ).split(',')[0].trim();
  const ua = String(req.headers['user-agent'] || '').trim();
  const viewerKey = req.userId ? `u:${req.userId}` : `a:${ip}|${ua}`;
  const key = `${String(itineraryId)}::${viewerKey}`;
  const now = Date.now();
  const last = recentViewHits.get(key) || 0;

  // Opportunistic cleanup to keep memory bounded.
  if (recentViewHits.size > 5000) {
    for (const [hitKey, ts] of recentViewHits.entries()) {
      if (now - ts > VIEW_DEDUPE_WINDOW_MS) {
        recentViewHits.delete(hitKey);
      }
    }
  }

  if (now - last < VIEW_DEDUPE_WINDOW_MS) {
    return false;
  }

  recentViewHits.set(key, now);
  return true;
}

function isDbReady() {
  return mongoose.connection.readyState === 1;
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Max day number from places; default 1. */
function computeDaysFromPlaces(places) {
  if (!Array.isArray(places) || places.length === 0) return 1;
  const nums = places.map((p) => Number(p?.dayNumber)).filter((n) => Number.isFinite(n) && n >= 1);
  if (nums.length === 0) return 1;
  return Math.max(1, ...nums);
}

/** Inclusive calendar-day count from YYYY-MM-DD strings (avoids TZ edge cases at noon UTC). */
function computeDaysFromDateRange(startStr, endStr) {
  const a = String(startStr || '').trim();
  const b = String(endStr || '').trim();
  if (!a || !b) return 1;
  const start = new Date(`${a}T12:00:00`);
  const end = new Date(`${b}T12:00:00`);
  if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime())) return 1;
  const diff = Math.round((end - start) / 86400000) + 1;
  return Math.max(1, diff);
}

function parseDurationFilter(durationParam) {
  const d = String(durationParam || '').trim().toLowerCase();
  if (!d) return null;
  if (d === '1-3 days' || d === '1-3') return { $gte: 1, $lte: 3 };
  if (d === '3-5 days' || d === '3-5') return { $gte: 3, $lte: 5 };
  if (d === '5-7 days' || d === '5-7') return { $gte: 5, $lte: 7 };
  if (d === '7-10 days' || d === '7-10') return { $gte: 7, $lte: 10 };
  if (d === '10-14 days' || d === '10-14') return { $gte: 10, $lte: 14 };
  if (d === '14+ days' || d === '14+') return { $gte: 14 };
  return null;
}

/**
 * Map trip day index from itinerary startDate (YYYY-MM-DD) and item date.
 */
function dayNumberFromStartAndItemDate(startDateStr, itemDateStr) {
  const s = String(startDateStr || '').trim().slice(0, 10);
  const d = String(itemDateStr || '').trim().slice(0, 10);
  if (!s || !d) return 1;
  const start = new Date(`${s}T12:00:00`);
  const item = new Date(`${d}T12:00:00`);
  if (!Number.isFinite(start.getTime()) || !Number.isFinite(item.getTime())) return 1;
  const diff = Math.round((item - start) / 86400000);
  return Math.max(1, diff + 1);
}

/** Kanban categories that represent mappable / publishable stops (not transport-only rows). */
const EXPENSE_ITEM_CATEGORIES_FOR_PLACES = new Set(['places', 'food', 'experiences', 'stays']);

function formatTimeRange(startTime = '', durationHrs = 0, durationMins = 0) {
  const start = String(startTime || '').trim();
  if (!start) return '';

  const [hours, minutes] = start.split(':').map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return start;

  const totalMinutes = (hours * 60) + minutes + (Number(durationHrs || 0) * 60) + Number(durationMins || 0);
  const normalized = ((totalMinutes % 1440) + 1440) % 1440;
  const endHours = Math.floor(normalized / 60);
  const endMinutes = normalized % 60;
  const end = `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
  return end !== start ? `${start} - ${end}` : start;
}

/**
 * Build Itinerary.places[] from tripExpenseItems for Explore / public views.
 */
function placesFromTripExpenseItems(items, startDateStr) {
  if (!Array.isArray(items)) return [];
  const raw = [];
  for (const it of items) {
    const cid = String(it?.categoryId || '').toLowerCase();
    if (!EXPENSE_ITEM_CATEGORIES_FOR_PLACES.has(cid)) continue;

    const name = String(it?.name || '').trim();
    if (!name) continue;

    const itemDate = cid === 'stays' ? (it.checkInDate || it.date || '') : (it.date || '');
    const dayNumber = dayNumberFromStartAndItemDate(startDateStr, itemDate);

    raw.push({
      name,
      category: String(it?.category != null ? it.category : it?.categoryId || ''),
      address: String(it?.detail != null ? it.detail : it?.address || ''),
      timeSlot: formatTimeRange(it?.startTime, it?.durationHrs, it?.durationMins),
      notes: String(it?.notes != null ? it.notes : ''),
      image: String(it?.placeImageUrl != null ? it.placeImageUrl : it?.image || ''),
      rating: it?.rating != null && it.rating !== '' ? Number(it.rating) : null,
      reviewCount: it?.reviewCount != null && it.reviewCount !== '' ? Number(it.reviewCount) : null,
      dayNumber,
      lat: it?.lat,
      lng: it?.lng,
    });
  }
  return normalizePlaces(raw);
}

function normalizePlaces(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.map((p) => ({
    name: p?.name != null ? String(p.name) : '',
    category: p?.category != null ? String(p.category) : '',
    address: p?.address != null ? String(p.address) : '',
    timeSlot: p?.timeSlot != null ? String(p.timeSlot) : '',
    notes: p?.notes != null ? String(p.notes) : '',
    image: p?.image != null ? String(p.image) : '',
    rating: p?.rating != null && p.rating !== '' ? Number(p.rating) : null,
    reviewCount: p?.reviewCount != null && p.reviewCount !== '' ? Number(p.reviewCount) : null,
    dayNumber: Math.max(1, Number(p?.dayNumber) || 1),
    lat: p?.lat != null && p.lat !== '' && Number.isFinite(Number(p.lat)) ? Number(p.lat) : null,
    lng: p?.lng != null && p.lng !== '' && Number.isFinite(Number(p.lng)) ? Number(p.lng) : null,
  }));
}

function serializeComment(c, currentUserId) {
  const likes = Array.isArray(c.likes) ? c.likes.map((x) => String(x)) : [];
  const likedByMe = currentUserId ? likes.includes(String(currentUserId)) : false;

  let userIdStr = '';
  let userPicture = '';
  if (c.userId && typeof c.userId === 'object' && c.userId._id) {
    userIdStr = String(c.userId._id);
    userPicture = c.userId.picture != null ? String(c.userId.picture).trim() : '';
  } else if (c.userId) {
    userIdStr = String(c.userId);
  }

  return {
    id: String(c._id),
    itineraryId: String(c.itineraryId),
    userId: userIdStr,
    userName: c.userName || '',
    userPicture,
    body: c.body,
    parentId: c.parentId ? String(c.parentId) : null,
    likeCount: likes.length,
    likedByMe,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  };
}

function normalizeCategories(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.map((c) => String(c).trim()).filter(Boolean);
}

function normalizeCitySegments(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((seg) => ({
      city: String(seg?.city || '').trim(),
      locationLabel: String(seg?.locationLabel || '').trim(),
      startDay: Math.max(1, Number(seg?.startDay) || 1),
      endDay: Math.max(1, Number(seg?.endDay) || 1),
    }))
    .filter((seg) => seg.city)
    .map((seg) => ({
      ...seg,
      startDay: Math.min(seg.startDay, seg.endDay),
      endDay: Math.max(seg.startDay, seg.endDay),
    }))
    .sort((a, b) => a.startDay - b.startDay);
}

function normalizeCoverImages(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.map((u) => String(u).trim()).filter(Boolean);
}

function normalizeCollaborators(raw) {
  if (!Array.isArray(raw)) return [];
  const seen = new Set();
  const normalized = [];

  for (const entry of raw) {
    let userId = null;
    let email = '';
    let role = 'editor';

    if (typeof entry === 'string') {
      email = entry;
    } else if (entry && typeof entry === 'object') {
      if (entry.userId && mongoose.isValidObjectId(String(entry.userId))) {
        userId = new mongoose.Types.ObjectId(String(entry.userId));
      }
      email = entry.email != null ? String(entry.email) : '';
      if (entry.role != null && String(entry.role).trim()) {
        role = String(entry.role).trim();
      }
    } else {
      continue;
    }

    email = email.trim().toLowerCase();
    if (!email && !userId) continue;

    const idKey = userId ? `uid:${String(userId)}` : '';
    const emailKey = email ? `em:${email}` : '';
    const key = `${idKey || emailKey}::${role.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);

    normalized.push({ userId, email, role });
  }

  return normalized;
}

function collaboratorUserIdStrings(collaborators) {
  const set = new Set();
  (Array.isArray(collaborators) ? collaborators : []).forEach((c) => {
    const id = c?.userId != null ? String(c.userId) : '';
    if (mongoose.isValidObjectId(id)) set.add(id);
  });
  return Array.from(set);
}

async function collaboratorRecipientIds(collaborators, excludeUserId = '') {
  const ids = new Set(collaboratorUserIdStrings(collaborators));

  const emailCandidates = Array.from(
    new Set(
      (Array.isArray(collaborators) ? collaborators : [])
        .map((c) => String(c?.email || '').trim().toLowerCase())
        .filter(Boolean)
    )
  );

  if (emailCandidates.length > 0) {
    const usersByEmail = await User.find({ email: { $in: emailCandidates } })
      .select('_id')
      .lean();
    usersByEmail.forEach((u) => {
      const id = String(u?._id || '');
      if (id) ids.add(id);
    });
  }

  const excluded = String(excludeUserId || '');
  if (excluded) ids.delete(excluded);
  return Array.from(ids);
}

async function attachCollaboratorUserIds(collaborators) {
  if (!Array.isArray(collaborators) || collaborators.length === 0) return [];

  const emailsToLookup = Array.from(
    new Set(
      collaborators
        .filter((c) => !c.userId && c.email)
        .map((c) => String(c.email).trim().toLowerCase())
        .filter(Boolean)
    )
  );

  if (emailsToLookup.length === 0) return collaborators;

  const users = await User.find({ email: { $in: emailsToLookup } })
    .select('_id email')
    .lean();
  const byEmail = new Map(users.map((u) => [String(u.email || '').trim().toLowerCase(), String(u._id)]));

  return collaborators.map((c) => {
    if (c.userId) return c;
    const matchedId = byEmail.get(String(c.email || '').trim().toLowerCase());
    if (!matchedId) return c;
    return { ...c, userId: new mongoose.Types.ObjectId(matchedId) };
  });
}

async function enrichCollaboratorsInItineraries(docs) {
  const list = Array.isArray(docs) ? docs : docs ? [docs] : [];
  if (list.length === 0) return Array.isArray(docs) ? [] : docs;

  const emails = Array.from(
    new Set(
      list.flatMap((doc) =>
        (Array.isArray(doc?.collaborators) ? doc.collaborators : [])
          .map((c) => String(c?.email || '').trim().toLowerCase())
          .filter(Boolean)
      )
    )
  );

  if (emails.length === 0) return docs;

  const users = await User.find({ email: { $in: emails } })
    .select('_id email name username picture')
    .lean();
  const byEmail = new Map(users.map((u) => [String(u.email || '').trim().toLowerCase(), u]));

  const enriched = list.map((doc) => {
    const collaborators = Array.isArray(doc?.collaborators) ? doc.collaborators : [];
    return {
      ...doc,
      collaborators: collaborators.map((c) => {
        const email = String(c?.email || '').trim().toLowerCase();
        const matched = byEmail.get(email);
        if (!matched) return c;
        return {
          ...c,
          userId: c?.userId || matched._id,
          user: {
            id: String(matched._id),
            email: matched.email || '',
            name: matched.name || '',
            username: matched.username || '',
            picture: matched.picture || '',
          },
        };
      }),
    };
  });

  return Array.isArray(docs) ? enriched : enriched[0];
}

function toAbsoluteAssetUrl(req, rawUrl) {
  const u = String(rawUrl || '').trim();
  if (!u) return '';
  if (/^(https?:)?\/\//i.test(u) || u.startsWith('data:')) return u;
  if (!u.startsWith('/')) return u;
  const host = req.get('host') || 'localhost:5000';
  const proto = req.headers['x-forwarded-proto'] || req.protocol || 'http';
  return `${proto}://${host}${u}`;
}

/**
 * GET /api/itineraries
 * Public community list: published + public only.
 * Query: sort, categories, duration, search
 */
router.get('/', async (req, res) => {
  try {
    if (!isDbReady()) {
      return res.status(503).json({ error: 'Database unavailable' });
    }

    const filter = { published: true, visibility: 'public' };

    const search = String(req.query.search || '').trim();
    if (search) {
      const q = escapeRegex(search);
      filter.$or = [
        { title: { $regex: q, $options: 'i' } },
        { destination: { $regex: q, $options: 'i' } },
        { overview: { $regex: q, $options: 'i' } },
      ];
    }

    const categories = String(req.query.categories || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (categories.length) {
      filter.categories = { $in: categories };
    }

    const range = parseDurationFilter(req.query.duration);
    if (range) {
      filter.days = range;
    }

    const sortKey = String(req.query.sort || 'newest').toLowerCase();
    let sort = { publishedAt: -1, createdAt: -1 };
    if (sortKey === 'most-popular' || sortKey === 'popular') {
      sort = { viewCount: -1, publishedAt: -1 };
    }

    const exclude = String(req.query.exclude || '').trim();
    if (exclude && mongoose.isValidObjectId(exclude)) {
      filter._id = { $ne: new mongoose.Types.ObjectId(exclude) };
    }

    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || '100'), 10) || 100));

    const docs = await Itinerary.find(filter)
      .sort(sort)
      .limit(limit)
      .populate('creator', 'name email picture username intro')
      .lean();

    const enriched = await enrichCollaboratorsInItineraries(docs);
    return res.json({ itineraries: enriched });
  } catch (err) {
    console.error('GET /itineraries error:', err);
    return res.status(500).json({ error: 'Failed to list itineraries' });
  }
});

/**
 * GET /api/itineraries/mine
 */
router.get('/mine', requireAuth, async (req, res) => {
  try {
    if (!isDbReady()) {
      return res.status(503).json({ error: 'Database unavailable' });
    }

    const docs = await Itinerary.find({ creator: req.userId })
      .sort({ updatedAt: -1 })
      .populate('creator', 'name email picture username intro')
      .lean();

    const enriched = await enrichCollaboratorsInItineraries(docs);
    return res.json({ itineraries: enriched });
  } catch (err) {
    console.error('GET /itineraries/mine error:', err);
    return res.status(500).json({ error: 'Failed to load your itineraries' });
  }
});


/**
 * GET /api/itineraries/shared-with-me
 */
router.get('/shared-with-me', requireAuth, async (req, res) => {
  try {
    if (!isDbReady()) {
      return res.status(503).json({ error: 'Database unavailable' });
    }

    const me = await User.findById(req.userId).select('email').lean();
    const myEmail = String(me?.email || '').trim().toLowerCase();

    const collaboratorMatch = [{ userId: new mongoose.Types.ObjectId(req.userId) }];
    if (myEmail) {
      const escaped = escapeRegex(myEmail);
      collaboratorMatch.push({ email: { $regex: `^${escaped}$`, $options: 'i' } });
    }

    const docs = await Itinerary.find({
      collaborators: {
        $elemMatch: { $or: collaboratorMatch },
      },
    })
      .sort({ updatedAt: -1 })
      .populate('creator', 'name email picture username intro')
      .lean();

    const enriched = await enrichCollaboratorsInItineraries(docs);
    return res.json({ itineraries: enriched });
  } catch (err) {
    console.error('GET /itineraries/shared-with-me error:', err);
    return res.status(500).json({ error: 'Failed to load shared itineraries' });
  }
});

/**
 * POST /api/itineraries/upload - single image (multipart field name: file)
 */
router.post('/upload', requireAuth, (req, res, next) => {
  uploadMw.single('file')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message || 'Upload failed' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const rel = `/uploads/itineraries/${req.file.filename}`;
    const host = req.get('host') || 'localhost:5000';
    const proto = req.headers['x-forwarded-proto'] || req.protocol || 'http';
    const url = `${proto}://${host}${rel}`;
    return res.status(201).json({ url, path: rel });
  });
});

/**
 * GET /api/itineraries/:id/comments
 */
router.get('/:id/comments', optionalAuth, async (req, res) => {
  try {
    if (!isDbReady()) {
      return res.status(503).json({ error: 'Database unavailable' });
    }
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid itinerary id' });
    }
    const exists = await Itinerary.findById(id).select('_id').lean();
    if (!exists) {
      return res.status(404).json({ error: 'Itinerary not found' });
    }
    const docs = await ItineraryComment.find({ itineraryId: id })
      .sort({ createdAt: 1 })
      .populate('userId', 'picture name')
      .lean();
    const uid = req.userId || null;
    return res.json({ comments: docs.map((c) => serializeComment(c, uid)) });
  } catch (err) {
    console.error('GET /itineraries/:id/comments error:', err);
    return res.status(500).json({ error: 'Failed to load comments' });
  }
});

/**
 * POST /api/itineraries/:id/comments
 */
router.post('/:id/comments', requireAuth, async (req, res) => {
  try {
    if (!isDbReady()) {
      return res.status(503).json({ error: 'Database unavailable' });
    }
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid itinerary id' });
    }
    const itinerary = await Itinerary.findById(id).select('_id creator title').lean();
    if (!itinerary) {
      return res.status(404).json({ error: 'Itinerary not found' });
    }

    const body = String(req.body?.body || '').trim();
    if (!body) {
      return res.status(400).json({ error: 'Comment body is required' });
    }

    let parentId = null;
    if (req.body?.parentId) {
      const pid = String(req.body.parentId);
      if (!mongoose.isValidObjectId(pid)) {
        return res.status(400).json({ error: 'Invalid parentId' });
      }
      const parent = await ItineraryComment.findById(pid);
      if (!parent || String(parent.itineraryId) !== id) {
        return res.status(400).json({ error: 'Invalid parent comment' });
      }
      parentId = parent._id;
    }

    const doc = await ItineraryComment.create({
      itineraryId: id,
      userId: req.userId,
      userName: req.user?.name || req.user?.username || req.user?.email || 'User',
      body,
      parentId,
    });

    const populated = await ItineraryComment.findById(doc._id).populate('userId', 'picture name').lean();

    const creatorId = String(itinerary?.creator || '');
    if (creatorId && creatorId !== String(req.userId)) {
      await createNotification({
        recipientId: creatorId,
        actorId: req.userId,
        type: 'itinerary_commented',
        title: 'New comment on your itinerary',
        message: `${req.user?.name || req.user?.username || 'Someone'} commented on "${itinerary?.title || 'your itinerary'}".`,
        link: `/itineraries/${id}?tab=comments`,
        meta: {
          itineraryId: String(id),
          commentId: String(doc._id),
        },
      });
    }

    return res.status(201).json({ comment: serializeComment(populated, req.userId) });
  } catch (err) {
    console.error('POST /itineraries/:id/comments error:', err);
    return res.status(500).json({ error: 'Failed to post comment' });
  }
});

/**
 * POST /api/itineraries/:id/comments/:commentId/like
 */
router.post('/:id/comments/:commentId/like', requireAuth, async (req, res) => {
  try {
    if (!isDbReady()) {
      return res.status(503).json({ error: 'Database unavailable' });
    }
    const { id, commentId } = req.params;
    if (!mongoose.isValidObjectId(id) || !mongoose.isValidObjectId(commentId)) {
      return res.status(400).json({ error: 'Invalid id' });
    }
    const comment = await ItineraryComment.findById(commentId);
    if (!comment || String(comment.itineraryId) !== id) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    const uid = new mongoose.Types.ObjectId(req.userId);
    const idx = comment.likes.findIndex((x) => String(x) === String(req.userId));
    let likedByMe;
    if (idx >= 0) {
      comment.likes.splice(idx, 1);
      likedByMe = false;
    } else {
      comment.likes.push(uid);
      likedByMe = true;
    }
    await comment.save();

    return res.json({ likeCount: comment.likes.length, likedByMe });
  } catch (err) {
    console.error('POST like comment error:', err);
    return res.status(500).json({ error: 'Failed to update like' });
  }
});

/**
 * POST /api/itineraries/:id/duplicate
 * Copy an itinerary into the current user's account as a new private, unpublished trip.
 * Source must be public+published (community) or owned by the user.
 */
router.post('/:id/duplicate', requireAuth, async (req, res) => {
  try {
    if (!isDbReady()) {
      return res.status(503).json({ error: 'Database unavailable' });
    }

    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid itinerary id' });
    }

    const src = await Itinerary.findById(id).lean();
    if (!src) {
      return res.status(404).json({ error: 'Itinerary not found' });
    }

    const isOwner = String(src.creator) === req.userId;
    const isPublicTemplate = Boolean(src.published && src.visibility === 'public');
    if (!isOwner && !isPublicTemplate) {
      return res.status(403).json({ error: 'Not allowed to copy this itinerary' });
    }

    const tripExpenseItemsIn = (() => {
      if (!Array.isArray(src.tripExpenseItems)) return [];
      try {
        return JSON.parse(JSON.stringify(src.tripExpenseItems));
      } catch {
        return [];
      }
    })();

    const startDate = src.startDate != null ? String(src.startDate).trim() : '';
    let placesFinal = normalizePlaces(src.places || []);
    if (placesFinal.length === 0 && tripExpenseItemsIn.length > 0) {
      placesFinal = placesFromTripExpenseItems(tripExpenseItemsIn, startDate);
    }

    let daysFinal = Number.isFinite(Number(src.days)) && Number(src.days) >= 1 ? Number(src.days) : 1;
    if (placesFinal.length > 0) {
      daysFinal = computeDaysFromPlaces(placesFinal);
    } else if (startDate && src.endDate) {
      daysFinal = computeDaysFromDateRange(startDate, String(src.endDate).trim());
    }

    const coverImages = normalizeCoverImages(src.coverImages).map((u) => toAbsoluteAssetUrl(req, u));
    const imageFromSrc = toAbsoluteAssetUrl(req, src.image != null ? String(src.image).trim() : '');
    const coverImagesFinal =
      coverImages.length > 0 ? coverImages : imageFromSrc ? [imageFromSrc] : [];

    const doc = await Itinerary.create({
      title: String(src.title || 'Untitled trip').trim() || 'Untitled trip',
      overview: src.overview != null ? String(src.overview) : '',
      creator: req.userId,
      customizedFromItineraryId: new mongoose.Types.ObjectId(id),
      destination: src.destination != null ? String(src.destination).trim() : '',
      locations: src.locations != null ? String(src.locations).trim() : '',
      startDate,
      endDate: src.endDate != null ? String(src.endDate).trim() : '',
      dates: src.dates != null ? String(src.dates) : '',
      budget: src.budget != null ? String(src.budget) : '$0',
      budgetSpent:
        src.budgetSpent != null && src.budgetSpent !== ''
          ? Math.max(0, Number(src.budgetSpent) || 0)
          : 0,
      travelers:
        src.travelers != null && src.travelers !== ''
          ? Math.max(1, Number(src.travelers) || 1)
          : 1,
      status: src.status != null ? String(src.status) : 'Planning',
      statusClass: src.statusClass != null ? String(src.statusClass) : '',
      image: imageFromSrc || (coverImagesFinal[0] ?? ''),
      placesSaved: placesFinal.length,
      days: daysFinal,
      categories: normalizeCategories(src.categories),
      coverImages: coverImagesFinal,
      tripExpenseItems: tripExpenseItemsIn,
      places: placesFinal,
      viewCount: 0,
      published: false,
      visibility: 'private',
      publishedAt: null,
    });

    const populated = await Itinerary.findById(doc._id)
      .populate('creator', 'name email picture username intro')
      .lean();

    const enrichedOne = await enrichCollaboratorsInItineraries(populated);
    return res.status(201).json({ itinerary: enrichedOne });
  } catch (err) {
    console.error('POST /itineraries/:id/duplicate error:', err);
    if (err.name === 'ValidationError') {
      const msg = Object.values(err.errors || {}).map((e) => e.message).join(' ') || err.message;
      return res.status(400).json({ error: msg });
    }
    return res.status(500).json({ error: 'Failed to duplicate itinerary' });
  }
});

/**
 * GET /api/itineraries/:id/customized-copy
 * Whether the current user already has a trip duplicated from this source itinerary.
 */
router.get('/:id/customized-copy', requireAuth, async (req, res) => {
  try {
    if (!isDbReady()) {
      return res.status(503).json({ error: 'Database unavailable' });
    }

    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid itinerary id' });
    }

    const existing = await Itinerary.findOne({
      creator: req.userId,
      customizedFromItineraryId: id,
    })
      .select('_id')
      .lean();

    return res.json({
      hasCopy: Boolean(existing),
      copyId: existing?._id ? String(existing._id) : undefined,
    });
  } catch (err) {
    console.error('GET /itineraries/:id/customized-copy error:', err);
    return res.status(500).json({ error: 'Failed to check customized copy' });
  }
});

/**
 * GET /api/itineraries/:id
 * Increments viewCount only for public itineraries viewed by non-owners.
 */
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    if (!isDbReady()) {
      return res.status(503).json({ error: 'Database unavailable' });
    }

    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid itinerary id' });
    }

    let itinerary = await Itinerary.findById(id)
      .populate('creator', 'name email picture username intro')
      .lean();

    if (!itinerary) {
      return res.status(404).json({ error: 'Itinerary not found' });
    }

    const creatorId = String(itinerary?.creator?._id || itinerary?.creator || '');
    const isOwner = Boolean(req.userId && creatorId && req.userId === creatorId);
    const isPublicPublished = Boolean(itinerary.published && itinerary.visibility === 'public');
    const shouldIncrementViewCount = isPublicPublished && !isOwner && shouldCountView(req, id);

    if (shouldIncrementViewCount) {
      itinerary = await Itinerary.findOneAndUpdate(
        { _id: id },
        { $inc: { viewCount: 1 } },
        { new: true }
      )
        .populate('creator', 'name email picture username intro')
        .lean();
    }

    const commentCount = await ItineraryComment.countDocuments({ itineraryId: id });

    const enrichedOne = await enrichCollaboratorsInItineraries({ ...itinerary, commentCount });
    return res.json({ itinerary: enrichedOne });
  } catch (err) {
    console.error('GET /itineraries/:id error:', err);
    return res.status(500).json({ error: 'Failed to load itinerary' });
  }
});

/**
 * POST /api/itineraries
 */
router.post('/', requireAuth, async (req, res) => {
  try {
    if (!isDbReady()) {
      return res.status(503).json({ error: 'Database unavailable' });
    }

    const title = String(req.body?.title || '').trim();
    if (!title) {
      return res.status(400).json({ error: 'title is required' });
    }

    const places = normalizePlaces(req.body?.places);
    const startDate = req.body?.startDate != null ? String(req.body.startDate).trim() : '';
    const endDate = req.body?.endDate != null ? String(req.body.endDate).trim() : '';
    let days =
      Number.isFinite(Number(req.body?.days)) && Number(req.body.days) >= 1
        ? Number(req.body.days)
        : null;
    if (days == null) {
      if (places.length > 0) {
        days = computeDaysFromPlaces(places);
      } else if (startDate && endDate) {
        days = computeDaysFromDateRange(startDate, endDate);
      } else {
        days = 1;
      }
    }

    const visibility = req.body?.visibility === 'public' ? 'public' : 'private';
    const published = Boolean(req.body?.published);

    const coverImages = normalizeCoverImages(req.body?.coverImages);
    const imageFromBody = req.body?.image != null ? String(req.body.image).trim() : '';
    const coverImagesFinal =
      coverImages.length > 0 ? coverImages : imageFromBody ? [imageFromBody] : [];

    const tripExpenseItemsIn = Array.isArray(req.body?.tripExpenseItems) ? req.body.tripExpenseItems : [];
    const placesFinal =
      places.length > 0
        ? places
        : tripExpenseItemsIn.length > 0
          ? placesFromTripExpenseItems(tripExpenseItemsIn, startDate)
          : [];

    let daysFinal = days;
    if (placesFinal.length > 0 && !(Number.isFinite(Number(req.body?.days)) && Number(req.body.days) >= 1)) {
      daysFinal = computeDaysFromPlaces(placesFinal);
    }

    const collaborators = await attachCollaboratorUserIds(
      normalizeCollaborators(req.body?.collaborators)
    );

    const collaboratorIds = await collaboratorRecipientIds(collaborators, String(req.userId));

    const doc = await Itinerary.create({
      title,
      overview: req.body?.overview != null ? String(req.body.overview) : '',
      creator: req.userId,
      destination: req.body?.destination != null ? String(req.body.destination).trim() : '',
      locations: req.body?.locations != null ? String(req.body.locations).trim() : '',
      citySegments: normalizeCitySegments(req.body?.citySegments),
      startDate,
      endDate,
      dates: req.body?.dates != null ? String(req.body.dates) : '',
      budget: req.body?.budget != null ? String(req.body.budget) : '$0',
      budgetSpent:
        req.body?.budgetSpent != null && req.body.budgetSpent !== ''
          ? Math.max(0, Number(req.body.budgetSpent) || 0)
          : 0,
      travelers:
        req.body?.travelers != null && req.body.travelers !== ''
          ? Math.max(1, Number(req.body.travelers) || 1)
          : 1,
      collaborators,
      status: req.body?.status != null ? String(req.body.status) : 'Planning',
      statusClass: req.body?.statusClass != null ? String(req.body.statusClass) : '',
      image: imageFromBody || (coverImagesFinal[0] ?? ''),
      placesSaved:
        req.body?.placesSaved != null && req.body.placesSaved !== ''
          ? Math.max(0, Number(req.body.placesSaved) || 0)
          : placesFinal.length,
      days: daysFinal,
      categories: normalizeCategories(req.body?.categories),
      coverImages: coverImagesFinal,
      tripExpenseItems: tripExpenseItemsIn,
      generalNotes: req.body?.generalNotes != null ? String(req.body.generalNotes) : '',
      generalAttachments: Array.isArray(req.body?.generalAttachments) ? req.body.generalAttachments : [],
      places: placesFinal,
      viewCount: 0,
      published,
      visibility,
      publishedAt: published ? new Date() : null,
    });

    const populated = await Itinerary.findById(doc._id)
      .populate('creator', 'name email picture username intro')
      .lean();

    if (collaboratorIds.length > 0) {
      await createNotifications(
        collaboratorIds.map((recipientId) => ({
          recipientId,
          actorId: req.userId,
          type: 'itinerary_added',
          title: 'You were added to a travel planner',
          message: `${req.user?.name || req.user?.username || 'Someone'} added you to "${doc.title}".`,
          link: `/trip/${String(doc._id)}`,
          meta: { itineraryId: String(doc._id) },
        }))
      );
    }

    const enrichedOne = await enrichCollaboratorsInItineraries(populated);
    return res.status(201).json({ itinerary: enrichedOne });
  } catch (err) {
    console.error('POST /itineraries error:', err);
    if (err.name === 'ValidationError') {
      const msg = Object.values(err.errors || {}).map((e) => e.message).join(' ') || err.message;
      return res.status(400).json({ error: msg });
    }
    return res.status(500).json({ error: 'Failed to create itinerary' });
  }
});

/**
 * PUT /api/itineraries/:id
 */
router.put('/:id', requireAuth, async (req, res) => {
  try {
    if (!isDbReady()) {
      return res.status(503).json({ error: 'Database unavailable' });
    }

    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid itinerary id' });
    }

    const existing = await Itinerary.findById(id);
    if (!existing) {
      return res.status(404).json({ error: 'Itinerary not found' });
    }
    if (String(existing.creator) !== req.userId) {
      return res.status(403).json({ error: 'Not allowed to edit this itinerary' });
    }

    const previousCollaboratorIds = await collaboratorRecipientIds(existing.collaborators, String(req.userId));

    const body = req.body || {};
    if (body.title != null) existing.title = String(body.title).trim();
    if (body.overview != null) existing.overview = String(body.overview);
    if (body.destination != null) existing.destination = String(body.destination).trim();
    if (body.locations != null) existing.locations = String(body.locations).trim();
    if (body.citySegments != null) existing.citySegments = normalizeCitySegments(body.citySegments);
    if (body.startDate != null) existing.startDate = String(body.startDate).trim();
    if (body.endDate != null) existing.endDate = String(body.endDate).trim();
    if (body.dates != null) existing.dates = String(body.dates);
    if (body.budget != null) existing.budget = String(body.budget);
    if (body.budgetSpent != null && body.budgetSpent !== '') {
      existing.budgetSpent = Math.max(0, Number(body.budgetSpent) || 0);
    }
    if (body.travelers != null && body.travelers !== '') {
      existing.travelers = Math.max(1, Number(body.travelers) || 1);
    }
    if (body.collaborators != null) {
      existing.collaborators = await attachCollaboratorUserIds(
        normalizeCollaborators(body.collaborators)
      );
    }
    if (body.status != null) existing.status = String(body.status);
    if (body.statusClass != null) existing.statusClass = String(body.statusClass);
    if (body.image != null) existing.image = String(body.image).trim();
    if (body.placesSaved != null && body.placesSaved !== '') {
      existing.placesSaved = Math.max(0, Number(body.placesSaved) || 0);
    }
    let placesDerivedFromTripExpense = false;
    if (body.tripExpenseItems != null && Array.isArray(body.tripExpenseItems)) {
      existing.tripExpenseItems = body.tripExpenseItems;
      existing.places = placesFromTripExpenseItems(body.tripExpenseItems, existing.startDate);
      existing.placesSaved = Array.isArray(existing.places) ? existing.places.length : 0;
      placesDerivedFromTripExpense = true;
    }
    if (body.generalNotes != null) existing.generalNotes = String(body.generalNotes);
    if (body.generalAttachments != null && Array.isArray(body.generalAttachments)) {
      existing.generalAttachments = body.generalAttachments;
    }
    if (body.categories != null) existing.categories = normalizeCategories(body.categories);
    if (body.coverImages != null) existing.coverImages = normalizeCoverImages(body.coverImages);
    if (body.places != null && !placesDerivedFromTripExpense) {
      existing.places = normalizePlaces(body.places);
    }
    if (body.days != null && Number(body.days) >= 1) {
      existing.days = Number(body.days);
    } else if (placesDerivedFromTripExpense || body.places != null) {
      existing.days = computeDaysFromPlaces(existing.places);
    }
    if (body.published != null) existing.published = Boolean(body.published);
    if (body.visibility === 'public' || body.visibility === 'private') {
      existing.visibility = body.visibility;
    }
    if (body.publishedAt != null && body.publishedAt !== '') {
      existing.publishedAt = new Date(body.publishedAt);
    }

    await existing.save();

    const currentCollaboratorIds = await collaboratorRecipientIds(existing.collaborators, String(req.userId));
    const newlyAddedCollaboratorIds = currentCollaboratorIds
      .filter((uid) => !previousCollaboratorIds.includes(uid));
    const existingCollaboratorIds = currentCollaboratorIds
      .filter((uid) => previousCollaboratorIds.includes(uid));

    if (newlyAddedCollaboratorIds.length > 0) {
      await createNotifications(
        newlyAddedCollaboratorIds.map((recipientId) => ({
          recipientId,
          actorId: req.userId,
          type: 'itinerary_added',
          title: 'You were added to a travel planner',
          message: `${req.user?.name || req.user?.username || 'Someone'} added you to "${existing.title}".`,
          link: `/trip/${String(existing._id)}`,
          meta: { itineraryId: String(existing._id) },
        }))
      );
    }

    if (existingCollaboratorIds.length > 0) {
      await createNotifications(
        existingCollaboratorIds.map((recipientId) => ({
          recipientId,
          actorId: req.userId,
          type: 'itinerary_updated',
          title: 'Travel planner updated',
          message: `${req.user?.name || req.user?.username || 'Someone'} made changes to "${existing.title}".`,
          link: `/trip/${String(existing._id)}`,
          meta: { itineraryId: String(existing._id) },
        }))
      );
    }

    const populated = await Itinerary.findById(existing._id)
      .populate('creator', 'name email picture username intro')
      .lean();

    const enrichedOne = await enrichCollaboratorsInItineraries(populated);
    return res.json({ itinerary: enrichedOne });
  } catch (err) {
    console.error('PUT /itineraries/:id error:', err);
    if (err.name === 'ValidationError') {
      const msg = Object.values(err.errors || {}).map((e) => e.message).join(' ') || err.message;
      return res.status(400).json({ error: msg });
    }
    return res.status(500).json({ error: 'Failed to update itinerary' });
  }
});

/**
 * DELETE /api/itineraries/:id
 */
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    if (!isDbReady()) {
      return res.status(503).json({ error: 'Database unavailable' });
    }

    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid itinerary id' });
    }

    const existing = await Itinerary.findById(id);
    if (!existing) {
      return res.status(404).json({ error: 'Itinerary not found' });
    }
    if (String(existing.creator) !== req.userId) {
      return res.status(403).json({ error: 'Not allowed to delete this itinerary' });
    }

    await Itinerary.deleteOne({ _id: id });
    return res.status(204).send();
  } catch (err) {
    console.error('DELETE /itineraries/:id error:', err);
    return res.status(500).json({ error: 'Failed to delete itinerary' });
  }
});

/**
 * POST /api/itineraries/:id/publish
 */
router.post('/:id/publish', requireAuth, async (req, res) => {
  try {
    if (!isDbReady()) {
      return res.status(503).json({ error: 'Database unavailable' });
    }

    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid itinerary id' });
    }

    const visibility = req.body?.visibility;
    if (visibility !== 'public' && visibility !== 'private') {
      return res.status(400).json({ error: 'visibility must be "public" or "private"' });
    }

    const existing = await Itinerary.findById(id);
    if (!existing) {
      return res.status(404).json({ error: 'Itinerary not found' });
    }
    if (String(existing.creator) !== req.userId) {
      return res.status(403).json({ error: 'Not allowed to publish this itinerary' });
    }

    const wasPublic = Boolean(existing.published && existing.visibility === 'public');

    existing.published = true;
    existing.visibility = visibility;
    existing.publishedAt = new Date();
    if (visibility === 'public' && !wasPublic) {
      existing.viewCount = 0;
    }

    if (req.body?.title != null) {
      const t = String(req.body.title).trim();
      if (t) existing.title = t;
    }
    if (req.body?.overview != null) {
      existing.overview = String(req.body.overview);
    }
    if (req.body?.categories != null) {
      existing.categories = normalizeCategories(req.body.categories);
    }
    if (req.body?.coverImages != null) {
      existing.coverImages = normalizeCoverImages(req.body.coverImages);
    }

    await existing.save();

    const populated = await Itinerary.findById(existing._id)
      .populate('creator', 'name email picture username intro')
      .lean();

    const enrichedOne = await enrichCollaboratorsInItineraries(populated);
    return res.json({ itinerary: enrichedOne });
  } catch (err) {
    console.error('POST /itineraries/:id/publish error:', err);
    if (err.name === 'ValidationError') {
      const msg = Object.values(err.errors || {}).map((e) => e.message).join(' ') || err.message;
      return res.status(400).json({ error: msg });
    }
    return res.status(500).json({ error: 'Failed to publish itinerary' });
  }
});

export default router;
