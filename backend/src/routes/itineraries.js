import express from 'express';
import mongoose from 'mongoose';
import crypto from 'crypto';
import { requireAuth } from '../middleware/auth.js';
import ItineraryEngagement from '../models/ItineraryEngagement.js';
import ItineraryComment from '../models/ItineraryComment.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

function safeTrim(value, max = 2000) {
  return String(value || '').trim().slice(0, max);
}

function isDbConnected() {
  return mongoose.connection.readyState === 1;
}

// In-memory fallback when DB not configured.
const MEM_ENGAGEMENT = new Map(); // itineraryId -> { viewCount, destination }
const MEM_COMMENTS = new Map(); // itineraryId -> comments[]

function memGetEngagement(itineraryId) {
  const hit = MEM_ENGAGEMENT.get(itineraryId);
  if (hit) return hit;
  const base = { viewCount: 0, destination: '', viewerKeys: new Set() };
  MEM_ENGAGEMENT.set(itineraryId, base);
  return base;
}

function memGetComments(itineraryId) {
  const list = MEM_COMMENTS.get(itineraryId);
  if (Array.isArray(list)) return list;
  const base = [];
  MEM_COMMENTS.set(itineraryId, base);
  return base;
}

router.get('/:itineraryId/engagement', async (req, res) => {
  try {
    const itineraryId = safeTrim(req.params.itineraryId, 200);
    if (!itineraryId) return res.status(400).json({ error: 'Missing itineraryId' });

    if (!isDbConnected()) {
      const engagement = memGetEngagement(itineraryId);
      const comments = memGetComments(itineraryId);
      return res.json({
        views: engagement.viewCount || 0,
        commentsCount: comments.length || 0,
      });
    }

    const [engagement, commentsCount] = await Promise.all([
      ItineraryEngagement.findOne({ itineraryId }).lean(),
      ItineraryComment.countDocuments({ itineraryId }),
    ]);

    return res.json({
      views: Number(engagement?.viewCount || 0),
      commentsCount: Number(commentsCount || 0),
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to load engagement' });
  }
});

router.post('/:itineraryId/view', async (req, res) => {
  try {
    const itineraryId = safeTrim(req.params.itineraryId, 200);
    const destination = safeTrim(req.body?.destination, 120);
    const viewerKeyFromBody = safeTrim(req.body?.viewerKey, 120);
    if (!itineraryId) return res.status(400).json({ error: 'Missing itineraryId' });

    const secret = process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? '' : 'wtg_dev_secret_change_me');
    const header = String(req.headers.authorization || '');
    const token = header.startsWith('Bearer ') ? header.slice('Bearer '.length).trim() : '';
    let viewerKey = viewerKeyFromBody || '';
    if (secret && token) {
      try {
        const decoded = jwt.verify(token, secret);
        if (decoded?.userId) viewerKey = String(decoded.userId);
      } catch {
        // ignore invalid tokens
      }
    }

    if (!viewerKey) {
      // last resort: avoid unbounded counting; treat as one anonymous bucket
      viewerKey = 'anonymous';
    }

    if (!isDbConnected()) {
      const engagement = memGetEngagement(itineraryId);
      engagement.viewerKeys.add(viewerKey);
      engagement.viewCount = engagement.viewerKeys.size;
      if (destination) engagement.destination = destination;
      return res.json({ views: engagement.viewCount });
    }

    const setDestinationExpr = destination
      ? destination
      : { $ifNull: ['$destination', ''] };

    const updated = await ItineraryEngagement.findOneAndUpdate(
      { itineraryId },
      [
        {
          $set: {
            itineraryId,
            destination: setDestinationExpr,
            viewerKeys: {
              $setUnion: [{ $ifNull: ['$viewerKeys', []] }, [viewerKey]],
            },
          },
        },
        {
          $set: {
            viewCount: { $size: '$viewerKeys' },
          },
        },
      ],
      { upsert: true, new: true }
    ).lean();

    return res.json({ views: Number(updated?.viewCount || 0) });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to record view' });
  }
});

router.get('/engagement/batch', async (req, res) => {
  try {
    const idsRaw = safeTrim(req.query?.ids, 5000);
    const ids = idsRaw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 80);
    if (ids.length === 0) return res.json({ items: [] });

    if (!isDbConnected()) {
      const items = ids.map((id) => {
        const engagement = memGetEngagement(id);
        const comments = memGetComments(id);
        return { itineraryId: id, views: engagement.viewCount || 0, commentsCount: comments.length || 0 };
      });
      return res.json({ items });
    }

    const [engagementDocs, commentCounts] = await Promise.all([
      ItineraryEngagement.find({ itineraryId: { $in: ids } }).lean(),
      ItineraryComment.aggregate([
        { $match: { itineraryId: { $in: ids } } },
        { $group: { _id: '$itineraryId', count: { $sum: 1 } } },
      ]),
    ]);

    const engagementById = new Map(engagementDocs.map((d) => [String(d.itineraryId), d]));
    const commentsById = new Map(commentCounts.map((d) => [String(d._id), Number(d.count || 0)]));

    const items = ids.map((id) => {
      const engagement = engagementById.get(String(id));
      return {
        itineraryId: id,
        views: Number(engagement?.viewCount || 0),
        commentsCount: Number(commentsById.get(String(id)) || 0),
      };
    });

    return res.json({ items });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to load engagement batch' });
  }
});

router.get('/:itineraryId/comments', async (req, res) => {
  try {
    const itineraryId = safeTrim(req.params.itineraryId, 200);
    if (!itineraryId) return res.status(400).json({ error: 'Missing itineraryId' });

    if (!isDbConnected()) {
      const comments = memGetComments(itineraryId);
      return res.json({ comments });
    }

    const comments = await ItineraryComment.find({ itineraryId })
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ comments });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to load comments' });
  }
});

router.post('/:itineraryId/comments', requireAuth, async (req, res) => {
  try {
    const itineraryId = safeTrim(req.params.itineraryId, 200);
    const destination = safeTrim(req.body?.destination, 120);
    const body = safeTrim(req.body?.body, 1200);
    if (!itineraryId) return res.status(400).json({ error: 'Missing itineraryId' });
    if (!body) return res.status(400).json({ error: 'Comment cannot be empty' });

    const user = req.user;
    if (!user?.id) return res.status(401).json({ error: 'Unauthorized' });

    if (!isDbConnected()) {
      const comments = memGetComments(itineraryId);
      const comment = {
        _id: crypto.randomUUID(),
        itineraryId,
        destination: destination || '',
        userId: user.id,
        userName: user.name,
        userPicture: user.picture || '',
        body,
        likes: [],
        replies: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      comments.unshift(comment);
      return res.status(201).json({ comment });
    }

    const comment = await ItineraryComment.create({
      itineraryId,
      destination: destination || '',
      userId: user.id,
      userName: user.name,
      userPicture: user.picture || '',
      body,
      likes: [],
      replies: [],
    });

    return res.status(201).json({ comment: comment.toObject() });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to post comment' });
  }
});

router.post('/:itineraryId/comments/:commentId/like', requireAuth, async (req, res) => {
  try {
    const itineraryId = safeTrim(req.params.itineraryId, 200);
    const commentId = safeTrim(req.params.commentId, 80);
    const userId = req.user?.id;
    if (!itineraryId || !commentId) return res.status(400).json({ error: 'Missing ids' });
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    if (!isDbConnected()) {
      const comments = memGetComments(itineraryId);
      const idx = comments.findIndex((c) => String(c._id) === String(commentId));
      if (idx < 0) return res.status(404).json({ error: 'Comment not found' });
      const likes = Array.isArray(comments[idx].likes) ? comments[idx].likes : [];
      const has = likes.includes(userId);
      comments[idx].likes = has ? likes.filter((id) => id !== userId) : [...likes, userId];
      comments[idx].updatedAt = new Date().toISOString();
      return res.json({ likesCount: comments[idx].likes.length, liked: !has });
    }

    const comment = await ItineraryComment.findOne({ _id: commentId, itineraryId });
    if (!comment) return res.status(404).json({ error: 'Comment not found' });

    const has = comment.likes.includes(userId);
    if (has) comment.likes = comment.likes.filter((id) => id !== userId);
    else comment.likes.push(userId);
    await comment.save();

    return res.json({ likesCount: comment.likes.length, liked: !has });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to like comment' });
  }
});

router.post('/:itineraryId/comments/:commentId/replies', requireAuth, async (req, res) => {
  try {
    const itineraryId = safeTrim(req.params.itineraryId, 200);
    const commentId = safeTrim(req.params.commentId, 80);
    const destination = safeTrim(req.body?.destination, 120);
    const body = safeTrim(req.body?.body, 1200);
    const user = req.user;
    if (!itineraryId || !commentId) return res.status(400).json({ error: 'Missing ids' });
    if (!body) return res.status(400).json({ error: 'Reply cannot be empty' });
    if (!user?.id) return res.status(401).json({ error: 'Unauthorized' });

    const reply = {
      _id: crypto.randomUUID(),
      userId: user.id,
      userName: user.name,
      userPicture: user.picture || '',
      body,
      likes: [],
      createdAt: new Date(),
    };

    if (!isDbConnected()) {
      const comments = memGetComments(itineraryId);
      const idx = comments.findIndex((c) => String(c._id) === String(commentId));
      if (idx < 0) return res.status(404).json({ error: 'Comment not found' });
      comments[idx].replies = Array.isArray(comments[idx].replies) ? comments[idx].replies : [];
      comments[idx].replies.push({
        ...reply,
        createdAt: reply.createdAt.toISOString(),
      });
      comments[idx].updatedAt = new Date().toISOString();
      return res.status(201).json({ reply: comments[idx].replies.at(-1) });
    }

    const comment = await ItineraryComment.findOne({ _id: commentId, itineraryId });
    if (!comment) return res.status(404).json({ error: 'Comment not found' });

    comment.destination = destination || comment.destination || '';
    comment.replies.push(reply);
    await comment.save();

    return res.status(201).json({ reply: comment.replies.at(-1) });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to post reply' });
  }
});

router.post('/:itineraryId/comments/:commentId/replies/:replyId/like', requireAuth, async (req, res) => {
  try {
    const itineraryId = safeTrim(req.params.itineraryId, 200);
    const commentId = safeTrim(req.params.commentId, 80);
    const replyId = safeTrim(req.params.replyId, 80);
    const userId = req.user?.id;
    if (!itineraryId || !commentId || !replyId) return res.status(400).json({ error: 'Missing ids' });
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    if (!isDbConnected()) {
      const comments = memGetComments(itineraryId);
      const cidx = comments.findIndex((c) => String(c._id) === String(commentId));
      if (cidx < 0) return res.status(404).json({ error: 'Comment not found' });
      const replies = Array.isArray(comments[cidx].replies) ? comments[cidx].replies : [];
      const ridx = replies.findIndex((r) => String(r._id) === String(replyId));
      if (ridx < 0) return res.status(404).json({ error: 'Reply not found' });
      const likes = Array.isArray(replies[ridx].likes) ? replies[ridx].likes : [];
      const has = likes.includes(userId);
      replies[ridx].likes = has ? likes.filter((id) => id !== userId) : [...likes, userId];
      comments[cidx].updatedAt = new Date().toISOString();
      return res.json({ likesCount: replies[ridx].likes.length, liked: !has });
    }

    const comment = await ItineraryComment.findOne({ _id: commentId, itineraryId });
    if (!comment) return res.status(404).json({ error: 'Comment not found' });
    const reply = comment.replies.find((r) => String(r._id) === String(replyId));
    if (!reply) return res.status(404).json({ error: 'Reply not found' });

    const has = reply.likes.includes(userId);
    if (has) reply.likes = reply.likes.filter((id) => id !== userId);
    else reply.likes.push(userId);
    await comment.save();

    return res.json({ likesCount: reply.likes.length, liked: !has });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to like reply' });
  }
});

export default router;

