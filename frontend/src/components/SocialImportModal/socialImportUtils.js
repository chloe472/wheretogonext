
export function placeKeySocialImport(p, idx) {
  return String(p?.id ?? p?.name ?? `si-${idx}`);
}
