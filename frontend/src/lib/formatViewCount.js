/**
 * Compact view counts for UI, e.g. 24990 → "24.99k", 842 → "842".
 */
export function formatViewCount(n) {
  const x = Math.max(0, Number(n) || 0);
  if (x < 1000) return String(Math.round(x));
  if (x < 1_000_000) {
    const k = x / 1000;
    return `${Number(k.toFixed(2))}k`;
  }
  const m = x / 1_000_000;
  return `${Number(m.toFixed(2))}M`;
}
