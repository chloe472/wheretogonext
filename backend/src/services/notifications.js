import mongoose from 'mongoose';
import Notification from '../models/Notification.js';
import { pushToUser } from '../lib/sseClients.js';

function toObjectIdOrNull(value) {
  if (!value) return null;
  const s = String(value);
  if (!mongoose.isValidObjectId(s)) return null;
  return new mongoose.Types.ObjectId(s);
}

function dedupeFilterFromPayload(payload) {
  const itineraryId = String(payload?.meta?.itineraryId || '').trim();
  const recipient = payload?.recipient;
  const actor = payload?.actor || null;
  const type = String(payload?.type || '').trim();
  if (!recipient || !type) return null;

  if (type === 'itinerary_updated' && itineraryId) {
    return {
      recipient,
      type,
      readAt: null,
      actor,
      'meta.itineraryId': itineraryId,
    };
  }

  if (type === 'friend_request_received' && payload?.meta?.fromUserId) {
    return {
      recipient,
      type,
      readAt: null,
      actor,
      'meta.fromUserId': String(payload.meta.fromUserId),
    };
  }

  if (type === 'friend_request_accepted' && payload?.meta?.acceptedByUserId) {
    return {
      recipient,
      type,
      readAt: null,
      actor,
      'meta.acceptedByUserId': String(payload.meta.acceptedByUserId),
    };
  }

  return null;
}

async function createNotificationDeduped(payload) {
  const filter = dedupeFilterFromPayload(payload);
  if (filter) {
    const exists = await Notification.findOne(filter).lean();
    if (exists?._id) {
      const populated = await Notification.findById(exists._id)
        .populate('actor', 'name picture')
        .lean();
      if (populated) {
        pushToUser(String(populated.recipient), 'notification', serializeNotification(populated));
      }
      return null;
    }
  }
  const doc = await Notification.create(payload);
  if (doc) {
    const populated = await doc.populate('actor', 'name picture');
    pushToUser(String(doc.recipient), 'notification', serializeNotification(populated));
  }
  return doc;
}

export async function createNotification({ recipientId, actorId = null, type, title, message = '', link = '', meta = {} }) {
  const recipient = toObjectIdOrNull(recipientId);
  if (!recipient) return null;

  const actorObjId = toObjectIdOrNull(actorId);
  const payload = {
    recipient,
    actor: actorObjId,
    type: String(type || '').trim(),
    title: String(title || '').trim(),
    message: String(message || '').trim(),
    link: String(link || '').trim(),
    meta: meta && typeof meta === 'object' ? meta : {},
  };

  if (!payload.type || !payload.title) return null;
  return createNotificationDeduped(payload);
}

export async function createNotifications(list = []) {
  const docs = (Array.isArray(list) ? list : [])
    .map((entry) => {
      const recipient = toObjectIdOrNull(entry?.recipientId);
      const actor = toObjectIdOrNull(entry?.actorId);
      const type = String(entry?.type || '').trim();
      const title = String(entry?.title || '').trim();
      if (!recipient || !type || !title) return null;
      return {
        recipient,
        actor,
        type,
        title,
        message: String(entry?.message || '').trim(),
        link: String(entry?.link || '').trim(),
        meta: entry?.meta && typeof entry.meta === 'object' ? entry.meta : {},
      };
    })
    .filter(Boolean);

  if (docs.length === 0) return [];

  const created = [];
  for (const payload of docs) {
    const inserted = await createNotificationDeduped(payload);
    if (inserted) created.push(inserted);
  }
  return created;
}

export function serializeNotification(doc) {
  const actor = doc?.actor && typeof doc.actor === 'object'
    ? {
      id: String(doc.actor._id || doc.actor.id || ''),
      name: doc.actor.name || '',
      picture: doc.actor.picture || '',
    }
    : null;

  return {
    id: String(doc?._id || ''),
    type: String(doc?.type || ''),
    title: String(doc?.title || ''),
    message: String(doc?.message || ''),
    link: String(doc?.link || ''),
    meta: doc?.meta && typeof doc.meta === 'object' ? doc.meta : {},
    createdAt: doc?.createdAt || null,
    updatedAt: doc?.updatedAt || null,
    isRead: Boolean(doc?.readAt),
    readAt: doc?.readAt || null,
    actor,
  };
}
