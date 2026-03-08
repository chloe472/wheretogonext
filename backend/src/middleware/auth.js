import jwt from 'jsonwebtoken';
import User from '../models/User.js';

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV === 'production') return '';
  return 'wtg_dev_secret_change_me';
}

export async function requireAuth(req, res, next) {
  try {
    const secret = getJwtSecret();
    if (!secret) {
      return res.status(500).json({ error: 'Server misconfiguration (JWT_SECRET). Add it to backend/.env' });
    }

    const header = String(req.headers.authorization || '');
    const bearer = header.startsWith('Bearer ') ? header.slice('Bearer '.length).trim() : '';
    const cookieToken = req.cookies?.wtg_token ? String(req.cookies.wtg_token) : '';
    const token = bearer || cookieToken || '';
    if (!token) return res.status(401).json({ error: 'Missing auth token' });

    const decoded = jwt.verify(token, secret);
    const userId = decoded?.userId;
    if (!userId) return res.status(401).json({ error: 'Invalid auth token' });

    const user = await User.findById(userId).lean();
    if (!user) return res.status(401).json({ error: 'User not found' });

    req.user = {
      id: String(user._id),
      name: user.name || user.username || user.email,
      picture: user.picture || '',
      createdAt: user.createdAt ? new Date(user.createdAt).toISOString() : null,
    };

    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired auth token' });
  }
}

