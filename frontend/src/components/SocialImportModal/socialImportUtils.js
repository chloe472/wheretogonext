/** Stable row key for social-import result list / selection Set. */
export function placeKeySocialImport(p, idx) {
  return String(p?.id ?? p?.name ?? `si-${idx}`);
}
