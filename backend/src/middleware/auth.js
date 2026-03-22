import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Requires `Authorization: Bearer <jwt>`. Sets `req.userId` and `req.user`.
 */
export async function requireAuth(req, res, next) {
  try {
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ error: 'Server misconfiguration (JWT_SECRET). Add it to backend/.env' });
    }
    const header = String(req.headers.authorization || '');
    const token = header.startsWith('Bearer ') ? header.slice('Bearer '.length).trim() : '';
    if (!token) {
      return res.status(401).json({ error: 'Missing auth token' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Invalid auth token' });
    }
    const user = await User.findById(userId).lean();
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    req.userId = String(user._id);
    req.user = {
      id: String(user._id),
      email: user.email,
      name: user.name,
      picture: user.picture,
      username: user.username,
    };
    return next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired auth token' });
  }
}

/** Sets `req.userId` when a valid Bearer token is present; otherwise continues without auth. */
export function optionalAuth(req, res, next) {
  try {
    if (!process.env.JWT_SECRET) return next();
    const header = String(req.headers.authorization || '');
    const token = header.startsWith('Bearer ') ? header.slice('Bearer '.length).trim() : '';
    if (!token) return next();
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded?.userId;
    if (userId) req.userId = String(userId);
    return next();
  } catch {
    return next();
  }
}
