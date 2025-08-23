// netlify/functions/reviews-post.js
export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const data = JSON.parse(event.body || '{}');

    // Honeypot (should be empty)
    if (data._gotcha && String(data._gotcha).trim() !== '') {
      return { statusCode: 200, body: JSON.stringify({ ok: true }) };
    }

    const name = (data.name || '').trim();
    const email = (data.email || '').trim();
    const text = (data.text || '').trim();
    const stars = Number(data.stars);

    // Basic validation
    if (!name || !email || !text || !stars) {
      return { statusCode: 400, body: 'Missing required fields' };
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { statusCode: 400, body: 'Invalid email' };
    }
    if (stars < 1 || stars > 5) {
      return { statusCode: 400, body: 'Stars must be 1–5' };
    }
    if (name.length > 80 || email.length > 120 || text.length > 1000) {
      return { statusCode: 400, body: 'Field too long' };
    }

    const review = {
      name,
      email,   // stored; you’re not rendering it publicly
      text,
      stars,
      created_at: new Date().toISOString(),
      ip: event.headers['x-nf-client-connection-ip']
        || event.headers['client-ip']
        || event.headers['x-forwarded-for']
        || ''
    };

    const { getStore } = await import('@netlify/blobs');
    const store = getStore('reviews');

    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    await store.set(id, JSON.stringify(review), { metadata: { type: 'review' } });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: true, id })
    };
  } catch (err) {
    console.error('reviews-post failed:', err);
    return { statusCode: 500, body: 'Server error (reviews-post)' };
  }
}
