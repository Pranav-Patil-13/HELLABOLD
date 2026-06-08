/**
 * Injects Cloudinary auto-format and auto-quality transformations into any
 * Cloudinary image URL so that browsers receive the optimal format (WebP/AVIF)
 * at the smallest acceptable file size — with zero manual work per image.
 *
 * Pattern:
 *   .../image/upload/<existing_transformations>/...
 *   →
 *   .../image/upload/f_auto,q_auto/<existing_transformations>/...
 *
 * - Safe to call with null / undefined / non-Cloudinary URLs (returns as-is).
 * - Idempotent: calling twice does not double-insert the transformations.
 */
export function cloudinaryOptimize(url) {
  if (!url || typeof url !== 'string') return url;

  // Only process Cloudinary upload URLs
  const UPLOAD_MARKER = '/image/upload/';
  const idx = url.indexOf(UPLOAD_MARKER);
  if (idx === -1) return url;

  const base = url.slice(0, idx + UPLOAD_MARKER.length);
  const rest = url.slice(idx + UPLOAD_MARKER.length);

  // Skip if already optimized
  if (rest.startsWith('f_auto') || rest.includes('/f_auto')) return url;

  return `${base}f_auto,q_auto/${rest}`;
}
