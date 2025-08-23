// netlify/functions/reviews-get.js
import { getStore } from '@netlify/blobs';

export const handler = async () => {
  try {
    const store = getStore('reviews');

    // List blob keys
    const list = await store.list(); // { blobs: [...] }
    const blobs = Array.isArray(list?.blobs) ? list.blobs : [];

    // Read each as JSON (Netlify Blobs can return parsed JSON)
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
        } catch (e) {
          console.error('reviews-get: error reading blob', b.key, e);
          return null;
        }
      })
    );

    const reviews = items
      .filter(Boolean)
      .sort((a, b) => (a.created_at > b.created_at ? -1 : 1))
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
