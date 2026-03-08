import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.js';
import discoveryRoutes from './routes/discovery.js';
import itinerariesRoutes from './routes/itineraries.js';
import tripsRoutes from './routes/trips.js';
import User from './models/User.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;
let httpServer = null;

app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'where to go next API',
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/discovery', discoveryRoutes);
app.use('/api/itineraries', itinerariesRoutes);
app.use('/api/trips', tripsRoutes);

async function start() {
  if (MONGODB_URI) {
    try {
      await mongoose.connect(MONGODB_URI);
      console.log('MongoDB connected');

      // Dev safety: fix old non-sparse unique indexes that block null values.
      if (process.env.NODE_ENV !== 'production') {
        try {
          const coll = mongoose.connection.collection('users');
          const indexes = await coll.indexes();
          const googleIndex = indexes.find((idx) => idx?.name === 'googleId_1');
          if (googleIndex?.unique && !googleIndex?.sparse) {
            console.warn('Dropping legacy non-sparse googleId_1 index');
            await coll.dropIndex('googleId_1');
          }
          await User.syncIndexes();
        } catch (err) {
          console.warn('User index sync warning:', err?.message || err);
        }
      }
    } catch (err) {
      console.error('MongoDB connection error:', err.message);
      process.exit(1);
    }
  } else {
    console.warn('No MONGODB_URI in .env — running without database');
  }

  httpServer = app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

start();

function shutdown(signal) {
  try {
    if (httpServer) {
      httpServer.close(() => process.exit(0));
      return;
    }
  } catch {
    // ignore
  }
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
