/**
 * In-memory registry of SSE clients.
 * Maps userId (string) → Set of Express response objects.
 */
const clients = new Map();

export function addClient(userId, res) {
  if (!clients.has(userId)) clients.set(userId, new Set());
  clients.get(userId).add(res);
}

export function removeClient(userId, res) {
  const set = clients.get(userId);
  if (!set) return;
  set.delete(res);
  if (set.size === 0) clients.delete(userId);
}

/**
 * Push a JSON event to all SSE connections for a given user.
 * @param {string} userId
 * @param {string} event  SSE event name
 * @param {object} data   Will be JSON-serialised into the `data:` field
 */
export function pushToUser(userId, event, data) {
  const set = clients.get(String(userId));
  if (!set || set.size === 0) return;
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const res of set) {
    try { res.write(payload); } catch { /* client already gone */ }
  }
}
