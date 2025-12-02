import dotenv from 'dotenv';
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import bodyParser from 'body-parser';
import cors from 'cors';
import https from 'https';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';
import { newUser, getUserByEmail, pool } from './db.js';
import { addBookToUser, retrieveBook, deleteUserBook } from './book_user.js';
import { updateDescription, updateUsername, getUserDetails, getFollowers, getFollowing, addFriend } from './user.js';
import searchRoute from './search/searchRoute.js';
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '706234058502-c2dk7t2rr4aod9mf5jg8essau207cnrs.apps.googleusercontent.com';

const app = express();
app.use(bodyParser.json());

// Enable CORS for the frontend during development and allow cookies
const frontendOrigin = process.env.FRONTEND_ORIGIN || 'http://localhost:3000';
app.use(cors({ origin: frontendOrigin, credentials: true }));

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret';

app.post('/api/auth/register', async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const result = await newUser(username, email, passwordHash);
    return res.status(201).json({ id: result.id });
  } catch (err) {
    if (err.message && err.message.toLowerCase().includes('exists')) {
      return res.status(409).json({ error: err.message });
    }
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Missing fields' });

  try {
    const user = await getUserByEmail(email);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, username: user.username, email: user.email }, JWT_SECRET, { expiresIn: '1h' });

    // Set HttpOnly cookie so browsers will send it automatically on subsequent requests
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 1000, // 1 hour
    };
    res.cookie('jwt', token, cookieOptions);

    return res.status(200).json({ token });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

function authMiddleware(req, res, next) {
  // Try Authorization header first
  let token = null;
  const auth = req.headers['authorization'];
  if (auth) {
    const parts = auth.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
      token = parts[1];
    }
  }

  // If no Authorization header, try cookie header (simple parse)
  if (!token && req.headers && req.headers.cookie) {
    const cookieHeader = req.headers.cookie; // e.g. "jwt=...; other=..."
    const jwtCookie = cookieHeader.split(';').map(c => c.trim()).find(c => c.startsWith('jwt='));
    if (jwtCookie) {
      token = decodeURIComponent(jwtCookie.split('=')[1]);
    }
  }

  if (!token) return res.status(401).json({ error: 'Missing token' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Verify Google ID token by calling Google's tokeninfo endpoint
async function verifyGoogleIdToken(idToken) {
  const url = `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`;
  return new Promise((resolve, reject) => {
    https.get(url, (resp) => {
      let data = '';
      resp.on('data', (chunk) => { data += chunk; });
      resp.on('end', () => {
        try {
          const payload = JSON.parse(data);
          resolve(payload);
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', (err) => reject(err));
  });
}

// Google Sign-In token exchange endpoint
app.post('/api/auth/google', async (req, res) => {
  const { id_token } = req.body || {};
  if (!id_token) return res.status(400).json({ error: 'Missing id_token' });

  try {
    const payload = await verifyGoogleIdToken(id_token);
    // payload must include aud (client id) and email
    if (!payload || payload.aud !== GOOGLE_CLIENT_ID) {
      return res.status(401).json({ error: 'Invalid Google ID token' });
    }

    const email = payload.email;
    const name = payload.name || (email ? email.split('@')[0] : 'googleuser');

    let user = await getUserByEmail(email);
    if (!user) {
      // create a deterministic username base
      const base = String(name).toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 40) || (email ? email.split('@')[0] : 'guser');
      const username = `${base}_${String(payload.sub).slice(-6)}`;
      const randomPassword = crypto.randomBytes(16).toString('hex');
      const passwordHash = await bcrypt.hash(randomPassword, 10);
      const created = await newUser(username, email, passwordHash);
      user = { username: created.username, email: created.email };
    }

    const token = jwt.sign({ username: user.username, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 1000,
    };
    res.cookie('jwt', token, cookieOptions);
    return res.status(200).json({ token });
  } catch (err) {
    console.error('Google auth error', err);
    return res.status(500).json({ error: 'Google auth failed' });
  }
});

app.get('/api/protected', authMiddleware, (req, res) => {
  return res.status(200).json({ username: req.user.username });
});

// DEBUGGING: Get current user info

app.get('/api/me', authMiddleware, (req, res) => {
  console.log('User in session:', req.user);  // <-- prints to your terminal
  res.json(req.user);                         // <-- sends JSON back to frontend
});


// Routes
app.use('/api/search', searchRoute);
app.post('/api/books/add', authMiddleware, async (req, res) => {
  try {
    const username = req.user.username;   // Dynamically get username
    const bookId = req.body.book_id;
    const { rating, review, status, added_at } = req.body;

    const newBook = await addBookToUser(username, bookId, rating, review, status, added_at);

    res.status(200).json(newBook);
  } catch (err) {
    console.error("Error adding book:", err);
    res.status(500).json({ error: err.message });
  }
});
app.get('/api/user_books', authMiddleware, async (req, res) => {
  try {
      const username = req.user.username;
      const books = await retrieveBook(username);
      res.json(books);
  } catch (err) {
    console.error("Error adding book:", err);
    res.status(500).json({ error: err.message });
  }
});

// Generate a single recommended book title based on user's books using Google Generative API
app.post('/api/recommendation', authMiddleware, async (req, res) => {
  try {
    const username = req.user.username;
    // Prefer titles provided in the POST body (client-side enriched titles)
    let titles = Array.isArray(req.body && req.body.titles) ? req.body.titles.filter(Boolean) : [];

    // If no titles in body, fall back to retrieving user's books from DB
    const books = await retrieveBook(username);
    if ((!titles || titles.length === 0) && Array.isArray(books) && books.length > 0) {
      // Try to turn book.book_id (Google volume IDs) into titles by querying Google Books
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

    if (!titles || titles.length === 0) {
      return res.status(400).json({ error: 'No book titles available to generate recommendation' });
    }

    // Build a concise prompt using up to 20 titles and limited characters
    const safeTitles = titles.slice(0, 20).map(t => String(t).replace(/\s+/g, ' ').trim());
    const joined = safeTitles.join('; ');
    const truncated = joined.length > 1000 ? joined.slice(0, 1000) + '...' : joined;

    const API_KEY = process.env.GEMINI_API_KEY;
    const MODEL = 'gemini-2.5-flash';
    if (!API_KEY) return res.status(500).json({ error: 'Missing GEMINI_API_KEY on server' });

    const promptText = `You are a helpful book recommender. Given the following book titles a user has read: ${truncated}. Please recommend exactly one book title the user is likely to enjoy next. Return only the book title, no explanation.`;

    const ai = new GoogleGenAI({});
    const resp = await ai.models.generateContent({ model: MODEL, contents: promptText });
    const recommendation = resp && resp.text;
    if (!recommendation) return res.status(500).json({ error: 'No recommendation returned', raw: resp });
    return res.json({ recommendation: String(recommendation).trim() });
  } catch (err) {
    console.error('Recommendation error', err);
    return res.status(500).json({ error: err.message });
  }
});
app.delete('/api/books/:bookId', authMiddleware, async (req, res) => {
  try {
    const username = req.user.username;
    const { bookId } = req.params;

    const result = await deleteUserBook(username, bookId);
    res.status(200).json(result);
  } catch (err) {
    console.error("Error deleting book:", err);
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/user/username', authMiddleware, async (req, res) => {
  try {
    const username = req.user.username;
    const { newUsername } = req.body;

    const result = await updateUsername(username, newUsername);
    res.status(200).json(result);
  }catch (err) {
    console.error("Error updating username:", err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/user/description', authMiddleware, async (req, res) => {
  try {
    const username = req.user.username;
    const userDetails = await getUserDetails(username);
    console.log('GET description - username:', username, 'userDetails:', userDetails);
    res.status(200).json({ description: userDetails?.description || '' });
  } catch (err) {
    console.error("Error fetching description:", err);
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/user/description', authMiddleware, async (req, res) => {
  try {
    const username = req.user.username;
    const { description } = req.body;
    console.log('PUT description - username:', username, 'description:', description);

    const result = await updateDescription(username, description);
    console.log('PUT description - result:', result);
    res.status(200).json(result);
  } catch (err) {
    console.error("Error updating description:", err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/user/followers', authMiddleware, async (req, res) => {
  try {
    const username = req.user.username;
    const followers = await getFollowers(username);
    res.status(200).json({ followers: followers.map(f => f.user_username), count: followers.length });
  } catch (err) {
    console.error("Error fetching followers:", err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/user/following', authMiddleware, async (req, res) => {
  try {
    const username = req.user.username;
    const following = await getFollowing(username);
    res.status(200).json({ following: following.map(f => f.friend_username), count: following.length });
  } catch (err) {
    console.error("Error fetching following:", err);
    res.status(500).json({ error: err.message });
  }
});

// Search for users by username (for autocomplete)
app.get('/api/users/search', authMiddleware, async (req, res) => {
  try {
    const { q } = req.query; // query parameter for search term
    if (!q || q.trim() === '') {
      return res.status(200).json({ users: [] });
    }

    const result = await pool.query(
      'SELECT username FROM users WHERE username ILIKE $1 LIMIT 10',
      [`%${q.trim()}%`]
    );

    res.status(200).json({ users: result.rows.map(row => row.username) });
  } catch (err) {
    console.error("Error searching users:", err);
    res.status(500).json({ error: err.message });
  }
});

// Add a friend
app.post('/api/user/friends', authMiddleware, async (req, res) => {
  try {
    console.log('POST /api/user/friends - Request received');
    const username = req.user.username;
    const { friendUsername } = req.body;
    console.log('Adding friend:', { username, friendUsername });

    if (!friendUsername || friendUsername.trim() === '') {
      return res.status(400).json({ error: 'Friend username is required' });
    }

    if (friendUsername === username) {
      return res.status(400).json({ error: 'Cannot add yourself as a friend' });
    }

    // Check if user exists
    const friendDetails = await getUserDetails(friendUsername.trim());
    if (!friendDetails) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if already following
    const following = await getFollowing(username);
    if (following.some(f => f.friend_username === friendUsername.trim())) {
      return res.status(409).json({ error: 'Already following this user' });
    }

    const result = await addFriend(username, friendUsername.trim());
    res.status(200).json({ message: 'Friend added successfully', friend: result });
  } catch (err) {
    console.error("Error adding friend:", err);
    // Handle unique constraint violation (already friends)
    if (err.code === '23505') {
      res.status(409).json({ error: 'Already following this user' });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});


// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message });
});

// If invoked directly, start the server. Otherwise export the app for tests.
const __filename = fileURLToPath(import.meta.url);
if (process.argv[1] === __filename) {
  const port = process.env.PORT || 3001;
  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`Backend API listening on port ${port}`);
  });
}

export default app;
