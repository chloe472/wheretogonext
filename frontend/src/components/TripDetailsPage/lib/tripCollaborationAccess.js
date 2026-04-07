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
