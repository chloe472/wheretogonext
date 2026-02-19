import { Router } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const router = Router();

const GOOGLE_USERINFO = 'https://www.googleapis.com/oauth2/v2/userinfo';

async function getGoogleUser(accessToken) {
  const res = await fetch(GOOGLE_USERINFO, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error('Invalid Google access token');
  return res.json();
}

router.post('/google', async (req, res) => {
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

    let user = await User.findOne({ googleId });
    if (!user) {
      user = await User.create({ googleId, email, name, picture });
    } else {
      user.name = name ?? user.name;
      user.picture = picture ?? user.picture;
      await user.save();
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        picture: user.picture,
      },
      token,
    });
  } catch (err) {
    console.error('Google auth error:', err);
    if (!res.headersSent) {
      if (err.message?.includes('Invalid Google access token')) {
        return res.status(401).json({ error: 'Invalid or expired Google sign-in. Try again.' });
      }
      if (!process.env.JWT_SECRET) {
        return res.status(500).json({ error: 'Server misconfiguration (JWT_SECRET).' });
      }
      res.status(500).json({ error: 'Sign-in failed. Try again.' });
    }
  }
});

export default router;
