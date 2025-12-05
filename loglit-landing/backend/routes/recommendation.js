import express from 'express';
import { GoogleGenAI } from '@google/genai';
import authMiddleware from '../middleware/auth.js';
import { retrieveBook } from '../book_user.js';
import https from 'https';

const router = express.Router();

/**
 * POST /api/recommendation
 * Generate a single book recommendation for the authenticated user
 * using the Google Generative API. Returns { recommendation: string }.
 */
router.post('/', authMiddleware, async (req, res) => {
  try {
    const username = req.user.username;
    let titles = Array.isArray(req.body && req.body.titles) ? req.body.titles.filter(Boolean) : [];

    const books = await retrieveBook(username);
    if ((!titles || titles.length === 0) && Array.isArray(books) && books.length > 0) {
      const fetchedTitles = [];
      for (let i = 0; i < Math.min(20, books.length); i++) {
        const b = books[i];
        if (!b || !b.book_id) continue;
        try {
          const gbRes = await new Promise((resolve, reject) => {
            https.get(`https://www.googleapis.com/books/v1/volumes/${encodeURIComponent(b.book_id)}`, (resp) => {
              let data = '';
              resp.on('data', chunk => { data += chunk; });
              resp.on('end', () => resolve({ ok: true, text: data }));
            }).on('error', (err) => reject(err));
          });
          const gbData = JSON.parse(gbRes.text);
          const t = gbData.volumeInfo && gbData.volumeInfo.title;
          if (t) fetchedTitles.push(t);
        } catch (e) {
          // ignore per-book fetch errors
        }
      }
      titles = fetchedTitles;
    }

    if (!titles || titles.length === 0) return res.status(400).json({ error: 'No book titles available to generate recommendation' });

    const safeTitles = titles.slice(0, 20).map(t => String(t).replace(/\s+/g, ' ').trim());
    const joined = safeTitles.join('; ');
    const truncated = joined.length > 1000 ? joined.slice(0, 1000) + '...' : joined;

    const API_KEY = process.env.GEMINI_API_KEY;
    const MODEL = 'gemini-2.5-flash';
    if (!API_KEY) return res.status(500).json({ error: 'Missing GEMINI_API_KEY on server' });

    const promptText = `You are a helpful book recommender. Given the following book titles a user has read: ${truncated}. Please recommend exactly one book title the user is likely to enjoy next. Return only the book title and author, no explanation.`;

    const ai = new GoogleGenAI({});
    const resp = await ai.models.generateContent({ model: MODEL, contents: promptText });
    const recommendation = resp && resp.text;
    if (!recommendation) return res.status(500).json({ error: 'No recommendation returned', raw: resp });
    return res.json({ recommendation: String(recommendation).trim() });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
