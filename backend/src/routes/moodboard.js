import { Router } from 'express';
import mongoose from 'mongoose';
import Moodboard from '../models/Moodboard.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/trip/:tripId', requireAuth, async (req, res) => {
  const { tripId } = req.params;
  try {
    let moodboard = await Moodboard.findOne({ tripId });
    if (!moodboard) {
      moodboard = await Moodboard.create({ tripId, creator: req.userId });
    }
    return res.json(moodboard.folders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load moodboard' });
  }
});

router.post('/trip/:tripId/folder', requireAuth, async (req, res) => {
  const { tripId } = req.params;
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Folder name required' });

  try {
    const moodboard = await Moodboard.findOneAndUpdate(
      { tripId },
      { $push: { folders: { name } } },
      { new: true, upsert: true }
    );
    res.status(201).json(moodboard.folders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create folder' });
  }
});

router.put('/trip/:tripId/folder/:folderId', requireAuth, async (req, res) => {
  const { tripId, folderId } = req.params;
  const { name } = req.body;

  try {
    const moodboard = await Moodboard.findOneAndUpdate(
      { tripId, 'folders._id': folderId },
      { 'folders.$.name': name },
      { new: true }
    );
    res.json(moodboard.folders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update folder' });
  }
});

router.delete('/trip/:tripId/folder/:folderId', requireAuth, async (req, res) => {
  const { tripId, folderId } = req.params;
  try {
    const moodboard = await Moodboard.findOneAndUpdate(
      { tripId },
      { $pull: { folders: { _id: folderId } } },
      { new: true }
    );
    res.json(moodboard.folders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete folder' });
  }
});

router.post('/trip/:tripId/folder/:folderId/image', requireAuth, async (req, res) => {
  const { tripId, folderId } = req.params;
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'Image URL required' });

  try {
    const moodboard = await Moodboard.findOneAndUpdate(
      { tripId, 'folders._id': folderId },
      { $push: { 'folders.$.images': { url } } },
      { new: true }
    );
    res.json(moodboard.folders.find(f => f._id.toString() === folderId).images);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add image' });
  }
});

router.post('/trip/:tripId/folder/:folderId/image/:imageId/reaction', requireAuth, async (req, res) => {
  const { tripId, folderId, imageId } = req.params;
  const { emoji } = req.body;

  try {
    const moodboard = await Moodboard.findOne({ tripId, 'folders._id': folderId });
    if (!moodboard) return res.status(404).json({ error: 'Moodboard not found' });

    const folder = moodboard.folders.id(folderId);
    const image = folder.images.id(imageId);
    if (!image) return res.status(404).json({ error: 'Image not found' });

    image.reactions.set(emoji, (image.reactions.get(emoji) || 0) + 1);
    await moodboard.save();
    res.json(image.reactions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to react to image' });
  }
});

router.delete('/trip/:tripId/folder/:folderId/image/:imageId', requireAuth, async (req, res) => {
  const { tripId, folderId, imageId } = req.params;

  try {
    const moodboard = await Moodboard.findOneAndUpdate(
      { tripId, 'folders._id': folderId },
      { $pull: { 'folders.$.images': { _id: imageId } } },
      { new: true }
    );

    if (!moodboard) return res.status(404).json({ error: 'Moodboard not found' });

    const folder = moodboard.folders.id(folderId);
    res.json(folder.images);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete image' });
  }
});

export default router;