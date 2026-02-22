import { Router } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';

const router = Router();

const GOOGLE_USERINFO = 'https://www.googleapis.com/oauth2/v2/userinfo';

function requireJwt(req, res, next) {
  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ error: 'Server misconfiguration (JWT_SECRET). Add it to backend/.env' });
  }
  next();
}

async function getGoogleUser(accessToken) {
  const res = await fetch(GOOGLE_USERINFO, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error('Invalid Google access token');
  return res.json();
}

function signToken(user) {
  return jwt.sign(
    { userId: user._id },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function userToJson(user) {
  return {
    id: user._id,
    email: user.email,
    name: user.name,
    picture: user.picture,
  };
}

router.post('/register', requireJwt, async (req, res) => {
  try {
    const { email, password, name, username } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }
    const emailTrim = String(email).trim().toLowerCase();
    if (!emailTrim) {
      return res.status(400).json({ error: 'Email is required.' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    }
    if (!/[\d]/.test(password)) {
      return res.status(400).json({ error: 'Password must contain at least one number.' });
    }
    if (!/[\W_]/.test(password)) {
      return res.status(400).json({ error: 'Password must contain at least one symbol.' });
    }

    const existing = await User.findOne({ $or: [{ email: emailTrim }, ...(username ? [{ username: String(username).trim() }] : [])] });
    if (existing) {
      if (existing.email === emailTrim) {
        return res.status(409).json({ error: 'An account with this email already exists.' });
      }
      return res.status(409).json({ error: 'Username is already taken.' });
    }

    const user = await User.create({
      email: emailTrim,
      password,
      name: name ? String(name).trim() : undefined,
      username: username ? String(username).trim() || undefined : undefined,
    });

    const token = signToken(user);
    res.status(201).json({ user: userToJson(user), token });
  } catch (err) {
    console.error('Register error:', err);
    if (!res.headersSent) {
      if (err.name === 'MongoServerError') {
        if (err.code === 11000) {
          const msg = err.message || '';
          if (msg.includes('googleId')) {
            return res.status(500).json({
              error: 'Database index issue: drop the old googleId index. In MongoDB Atlas or shell run: db.users.dropIndex("googleId_1") then restart the server.',
            });
          }
          return res.status(409).json({ error: 'Email or username already in use.' });
        }
        return res.status(503).json({ error: 'Database error. Try again.' });
      }
      if (err.name === 'ValidationError') {
        const msg = Object.values(err.errors || {}).map((e) => e.message).join(' ') || err.message;
        return res.status(400).json({ error: msg || 'Validation failed.' });
      }
      const message = process.env.NODE_ENV === 'development' ? err.message : 'Sign up failed. Try again.';
      res.status(500).json({ error: message });
    }
  }
});

router.post('/login', requireJwt, async (req, res) => {
  try {
    const { emailOrUsername, password } = req.body;
    if (!emailOrUsername || !password) {
      return res.status(400).json({ error: 'Email/username and password are required.' });
    }

    const isEmail = emailOrUsername.includes('@');
    const user = await User.findOne(
      isEmail
        ? { email: String(emailOrUsername).trim().toLowerCase() }
        : { username: String(emailOrUsername).trim() }
    );
    if (!user || !user.password) {
      return res.status(401).json({ error: 'Invalid email/username or password.' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: 'Invalid email/username or password.' });
    }

    const token = signToken(user);
    res.json({ user: userToJson(user), token });
  } catch (err) {
    console.error('Login error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Log in failed. Try again.' });
    }
  }
});

router.post('/google', requireJwt, async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ error: 'Missing credential (Google access token)' });
    }

    const payload = await getGoogleUser(credential);
    const googleId = payload.id || payload.sub;
    const { email, name, picture } = payload;
    if (!googleId || !email) {
      return res.status(400).json({ error: 'Google account must have an email' });
    }

    const emailTrim = email.trim().toLowerCase();
    let user = await User.findOne({ googleId });
    if (!user) {
      user = await User.findOne({ email: emailTrim });
      if (user) {
        user.googleId = googleId;
        user.name = name ?? user.name;
        user.picture = picture ?? user.picture;
        await user.save();
      } else {
        user = await User.create({ googleId, email: emailTrim, name, picture });
      }
    } else {
      user.name = name ?? user.name;
      user.picture = picture ?? user.picture;
      await user.save();
    }

    const token = signToken(user);
    res.json({ user: userToJson(user), token });
  } catch (err) {
    console.error('Google auth error:', err);
    if (!res.headersSent) {
      if (err.message?.includes('Invalid Google access token')) {
        return res.status(401).json({ error: 'Invalid or expired Google sign-in. Try again.' });
      }
      if (err.name === 'MongoServerError' || err.message?.includes('MongoDB')) {
        return res.status(503).json({ error: 'Database unavailable. Check backend/.env MONGODB_URI and that MongoDB is running.' });
      }
      res.status(500).json({ error: err.message || 'Sign-in failed. Try again.' });
    }
  }
});

export default router;
