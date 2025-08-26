// netlify/functions/reviews-post.js
import { blobs } from '@netlify/blobs';
import { Buffer } from 'node:buffer';
import Busboy from 'busboy';

export const config = {
  path: '/reviews-post',
  method: 'POST',
};

function parseMultipart(event) {
  return new Promise((resolve, reject) => {
    try {
      const bb = Busboy({ headers: event.headers });
      const fields = {};
      const files = {};

      bb.on('file', (name, file, info) => {
        const chunks = [];
        const { filename, mimeType } = info || {};
        file.on('data', (d) => chunks.push(d));
        file.on('end', () => {
          files[name] = {
            buffer: Buffer.concat(chunks),
            filename: filename || 'upload.bin',
            mimeType: mimeType || 'application/octet-stream'
          };
        });
      });

      bb.on('field', (name, val) => { fields[name] = val; });
      bb.on('finish', () => resolve({ fields, files }));
      bb.end(Buffer.from(event.body, event.isBase64Encoded ? 'base64' : 'utf8'));
    } catch (e) { reject(e); }
  });
}

export default async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    // Parse multipart form
    const { fields, files } = await parseMultipart(event);
    const { name = '', email = '', text = '', stars = '5', _gotcha = '' } = fields;

    if (_gotcha) return { statusCode: 400, body: 'Spam detected' };
    if (!name || !email || !text) return { statusCode: 400, body: 'Missing fields' };

    // Optional: store photo if provided
    let photoUrl = '';
    const photo = files.photo;
    if (photo && photo.buffer && photo.buffer.length > 0) {
      const ext = (photo.filename || '').split('.').pop()?.toLowerCase() || 'jpg';
      const key = `review-photos/${Date.now()}-${Math.random().toString(16).slice(2)}.${ext}`;

      // Store binary in Netlify Blobs (public bucket)
      await blobs.set(key, photo.buffer, {
        contentType: photo.mimeType || 'image/jpeg',
        addRandomSuffix: false,
        // public store so it returns a public URL
        // (Netlify Blobs uses the site’s public blob URL automatically)
      });

      // Build public URL for this blob
      const { url } = blobs.getStore();
      photoUrl = `${url}/${key}`;
    }

    // Fetch existing reviews
    const store = blobs;
    const keyReviews = 'data/reviews.json';
    let items = [];
    const existing = await store.get(keyReviews, { type: 'json' });
    if (existing) items = existing;

    // Push new review
    const review = {
      id: `r_${Date.now()}`,
      name, email, text,
      stars: Math.max(1, Math.min(5, Number(stars) || 5)),
      photoUrl,
      ts: new Date().toISOString()
    };
    items.unshift(review);

    // Save back
    await store.set(keyReviews, JSON.stringify(items), {
      contentType: 'application/json; charset=utf-8',
      addRandomSuffix: false
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: true, review })
    };
  } catch (err) {
    console.error('reviews-post error:', err);
    return { statusCode: 500, body: 'Server error' };
  }
};
