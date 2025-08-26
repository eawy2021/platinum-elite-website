// netlify/functions/reviews-post.js
import { getStore } from '@netlify/blobs';

function getStoreSafe(name) {
  try { return getStore(name); } catch (e) { /* fall through */ }
  const siteID = process.env.NETLIFY_SITE_ID;
  const token  = process.env.NETLIFY_AUTH_TOKEN || process.env.NETLIFY_API_TOKEN;
  if (!siteID || !token) {
    throw new Error('Blobs not configured: set NETLIFY_SITE_ID and NETLIFY_AUTH_TOKEN.');
  }
  return getStore({ name, siteID, token });
}

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const data = JSON.parse(event.body || '{}');

    // honeypot
    if (data._gotcha && String(data._gotcha).trim() !== '') {
      return { statusCode: 200, body: JSON.stringify({ ok: true }) };
    }

    const name  = (data.name  || '').trim();
    const email = (data.email || '').trim();
    const text  = (data.text  || '').trim();
    const stars = Number(data.stars);

    if (!name || !email || !text || !stars) {
      return { statusCode: 400, body: 'Missing required fields' };
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { statusCode: 400, body: 'Invalid email' };
    }
    if (stars < 1 || stars > 5) {
      return { statusCode: 400, body: 'Stars must be 1–5' };
    }

    const review = {
      name, email, text, stars,
      created_at: new Date().toISOString(),
      ip:
        event.headers['x-nf-client-connection-ip'] ||
        event.headers['client-ip'] ||
        event.headers['x-forwarded-for'] || ''
    };

    const store = getStoreSafe('reviews');
    const id = `${Date.now()}-${Math.random().toString(36).slice(2,8)}`;

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
};
