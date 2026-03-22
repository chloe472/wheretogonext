import express from 'express';
import path from 'path';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

// Load environment variables FIRST
dotenv.config();

console.log('[Server] GOOGLE_PLACES_API_KEY loaded:', Boolean(process.env.GOOGLE_PLACES_API_KEY));

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'where to go next API',
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    googlePlacesConfigured: Boolean(process.env.GOOGLE_PLACES_API_KEY),
  });
});

async function start() {
  // Dynamically import routes AFTER env vars are loaded
  const { default: authRoutes } = await import('./routes/auth.js');
  const { default: discoveryRoutes } = await import('./routes/discovery.js');
  const { default: itinerariesRoutes } = await import('./routes/itineraries.js');

  app.use('/api/auth', authRoutes);
  app.use('/api/discovery', discoveryRoutes);
  app.use('/api/itineraries', itinerariesRoutes);

  if (MONGODB_URI) {
    try {
      await mongoose.connect(MONGODB_URI);
      console.log('MongoDB connected');
    } catch (err) {
      console.error('MongoDB connection error:', err.message);
      process.exit(1);
    }
  } else {
    console.warn('No MONGODB_URI in .env — running without database');
  }

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

start();
