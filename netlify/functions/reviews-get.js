// netlify/functions/reviews-get.js
import { getStore } from '@netlify/blobs';

function getStoreSafe(name) {
  // Try default runtime wiring first
  try { return getStore(name); } catch (e) { /* fall through */ }
  // Fallback to explicit env config
  const siteID = process.env.NETLIFY_SITE_ID;
  const token  = process.env.NETLIFY_AUTH_TOKEN || process.env.NETLIFY_API_TOKEN;
  if (!siteID || !token) {
    throw new Error('Blobs not configured: set NETLIFY_SITE_ID and NETLIFY_AUTH_TOKEN.');
  }
  return getStore({ name, siteID, token });
}

export const handler = async () => {
  try {
    const store = getStoreSafe('reviews');
    const list = await store.list();
    const blobs = Array.isArray(list?.blobs) ? list.blobs : [];

    const items = await Promise.all(
      blobs.map(async (b) => {
        try {
          const r = await store.get(b.key, { type: 'json' });
          if (!r) return null;
          return {
            name: r.name,
            text: r.text,
            stars: Number(r.stars) || 5,
            created_at: r.created_at || b.uploadedAt || new Date().toISOString()
          };
        } catch {
          return null;
        }
      })
    );

    const reviews = items.filter(Boolean)
      .sort((a,b) => (a.created_at > b.created_at ? -1 : 1))
      .slice(0, 50);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      body: JSON.stringify(reviews)
    };
  } catch (err) {
    console.error('reviews-get failed:', err);
    return { statusCode: 500, body: 'Server error (reviews-get)' };
  }
};
