// netlify/functions/reviews-get.js
export async function handler() {
  try {
    const { getStore } = await import('@netlify/blobs');
    const store = getStore('reviews');

    const list = await store.list(); // { blobs: [...] }
    const blobs = Array.isArray(list?.blobs) ? list.blobs : [];

    const items = await Promise.all(
      blobs.map(async (b) => {
        try {
          // Read as JSON (avoids JSON.parse crashes)
          const r = await store.get(b.key, { type: 'json' });
          if (!r) return null;
          return {
            name: r.name,
            text: r.text,
            stars: Number(r.stars) || 5,
            created_at: r.created_at || b.uploadedAt || new Date().toISOString()
          };
        } catch (e) {
          console.error('Error reading blob', b.key, e);
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
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store'
      },
      body: JSON.stringify(reviews)
    };
  } catch (err) {
    console.error('reviews-get failed:', err);
    return { statusCode: 500, body: 'Server error (reviews-get)' };
  }
}
