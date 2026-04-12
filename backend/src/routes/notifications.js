import { Router } from 'express';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import Notification from '../models/Notification.js';
import { requireAuth } from '../middleware/auth.js';
import { serializeNotification } from '../services/notifications.js';
import { addClient, removeClient } from '../lib/sseClients.js';

const router = Router();

function isDbReady() {
  return mongoose.connection.readyState === 1;
}

router.get('/', requireAuth, async (req, res) => {
  try {
    if (!isDbReady()) {
      return res.status(503).json({ error: 'Database unavailable' });
    }

    const unreadOnly = String(req.query.unreadOnly || '').trim().toLowerCase() === 'true';
    const limitRaw = parseInt(String(req.query.limit || '30'), 10);
    const limit = Math.max(1, Math.min(100, Number.isFinite(limitRaw) ? limitRaw : 30));

    const filter = { recipient: req.userId };
    if (unreadOnly) filter.readAt = null;

    const [rows, unreadCount] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('actor', 'name picture')
        .lean(),
      Notification.countDocuments({ recipient: req.userId, readAt: null }),
    ]);

    return res.json({
      notifications: rows.map(serializeNotification),
      unreadCount,
    });
  } catch (err) {
    console.error('GET /notifications error:', err);
    return res.status(500).json({ error: 'Failed to load notifications' });
  }
});

router.post('/read-all', requireAuth, async (req, res) => {
  try {
    if (!isDbReady()) {
      return res.status(503).json({ error: 'Database unavailable' });
    }

    await Notification.updateMany(
      { recipient: req.userId, readAt: null },
      { $set: { readAt: new Date() } }
    );

    const unreadCount = await Notification.countDocuments({ recipient: req.userId, readAt: null });
    return res.json({ ok: true, unreadCount });
  } catch (err) {
    console.error('POST /notifications/read-all error:', err);
    return res.status(500).json({ error: 'Failed to mark notifications as read' });
  }
});

router.post('/:id/read', requireAuth, async (req, res) => {
  try {
    if (!isDbReady()) {
      return res.status(503).json({ error: 'Database unavailable' });
    }

    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid notification id' });
    }

    const updated = await Notification.findOneAndUpdate(
      { _id: id, recipient: req.userId },
      { $set: { readAt: new Date() } },
      { new: true }
    )
      .populate('actor', 'name picture')
      .lean();

    if (!updated) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    const unreadCount = await Notification.countDocuments({ recipient: req.userId, readAt: null });
    return res.json({ ok: true, unreadCount, notification: serializeNotification(updated) });
  } catch (err) {
    console.error('POST /notifications/:id/read error:', err);
    return res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});





router.get('/stream', async (req, res) => {
  try {
    const token = String(req.query.token || '').trim();
    if (!token || !process.env.JWT_SECRET) {
      return res.status(401).end();
    }
    let userId;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      userId = decoded?.userId ? String(decoded.userId) : null;
    } catch {
      return res.status(401).end();
    }
    if (!userId) return res.status(401).end();

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); 
    res.flushHeaders();

    
    res.write('event: connected\ndata: {}\n\n');

    addClient(userId, res);

    
    const ping = setInterval(() => {
      try { res.write(': ping\n\n'); } catch {  }
    }, 25000);

    req.on('close', () => {
      clearInterval(ping);
      removeClient(userId, res);
    });
  } catch (err) {
    console.error('GET /notifications/stream error:', err);
    return res.status(500).end();
  }
});

export default router;
