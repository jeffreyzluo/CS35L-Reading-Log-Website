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
import { newUser, getUserByEmail } from './db.js';
import { addBookToUser, retrieveBook, deleteUserBook } from './book_user.js';
import searchRoute from './search/searchRoute.js';

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
      user = { id: created.id, username: created.username, email: created.email };
    }

    const token = jwt.sign({ id: user.id, username: user.username, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
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
