// netlify/functions/reviews-get.js
import { blobs } from '@netlify/blobs';

export const config = {
  path: '/reviews-get',
  method: 'GET',
};

export default async () => {
  try {
    const data = await blobs.get('data/reviews.json', { type: 'json' });
    const items = Array.isArray(data) ? data : [];
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      body: JSON.stringify(items)
    };
  } catch (e) {
    // If missing, just return empty list
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      body: JSON.stringify([])
    };
  }
};
