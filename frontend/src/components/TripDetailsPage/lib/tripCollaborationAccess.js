function normalizeId(value) {
  if (value == null) return '';
  if (typeof value === 'object' && value.$oid) return String(value.$oid).trim();
  return String(value).trim();
}


export function getCurrentUserCollaboratorRole(user, collaborators) {
  const userId = String(user?.id || user?._id || '').trim();
  const userEmail = String(user?.email || '').trim().toLowerCase();
  if (!userId && !userEmail) return null;

  const list = Array.isArray(collaborators) ? collaborators : [];
  const match = list.find((c) => {
    const cid = normalizeId(c?.userId ?? c?.user?._id ?? c?.user?.id);
    if (userId && cid && cid === userId) return true;
    const email = String(c?.email || '').trim().toLowerCase();
    if (userEmail && email && email === userEmail) return true;
    return false;
  });
  if (!match) return null;
  // Backend normalizeCollaborators defaults omitted role to "editor", not "viewer".
  const r = String(match.role ?? '').trim().toLowerCase();
  return r === 'viewer' ? 'viewer' : 'editor';
}

/** Role string for API payloads — matches backend default when role is missing. */
export function collaboratorRoleForApi(c) {
  const r = String(c?.role ?? '').trim().toLowerCase();
  return r === 'viewer' ? 'viewer' : 'editor';
}


export function isCurrentUserTripCollaborator(user, collaborators) {
  const userId = String(user?.id || user?._id || '').trim();
  const userEmail = String(user?.email || '').trim().toLowerCase();
  if (!userId && !userEmail) return false;

  const list = Array.isArray(collaborators) ? collaborators : [];
  return list.some((c) => {
    const cid = normalizeId(c?.userId ?? c?.user?._id ?? c?.user?.id);
    if (userId && cid && cid === userId) return true;
    const email = String(c?.email || '').trim().toLowerCase();
    if (userEmail && email && email === userEmail) return true;
    return false;
  });
}

/** Shown when Publish / Make private / Edit published is disabled (viewers, link-only editors, etc.). */
export const PUBLISH_TO_EXPLORE_DISABLED_HINT =
  'Only the trip owner or an editor collaborator can publish to Explore. Duplicate this trip to publish your own copy.';

/**
 * Matches backend: owner or invited collaborator with editor role (not link-only “anyone” editors).
 * @param {object} user
 * @param {object} itineraryDoc itinerary-like object with creator + collaborators
 */
export function canUserPublishItinerary(user, itineraryDoc = {}) {
  const userId = String(user?.id || user?._id || '').trim();
  const creatorId = normalizeId(
    itineraryDoc?.creator?._id ?? itineraryDoc?.creator?.id ?? itineraryDoc?.creator,
  );
  if (userId && creatorId && userId === creatorId) return true;
  return getCurrentUserCollaboratorRole(user, itineraryDoc.collaborators) === 'editor';
}
