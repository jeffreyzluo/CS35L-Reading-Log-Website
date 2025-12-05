import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import https from 'https';
import crypto from 'crypto';
import { getUserByEmail } from '../db.js';
import { newUser as createUser } from '../user.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

/**
 * Helper that verifies a Google ID token using Google's tokeninfo endpoint.
 * @param {string} idToken
 * @returns {Promise<Object>} payload
 */
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

/**
 * POST /api/auth/register
 * Register a new user; validates password strength and returns the username.
 */
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  const errors = [];
  if (String(password).length < 8) errors.push('password must be at least 8 characters');
  if (!/[A-Z]/.test(String(password))) errors.push('password must include an uppercase letter');
  if (!/\d/.test(String(password))) errors.push('password must include a digit');
  if (errors.length > 0) return res.status(400).json({ error: errors.join('; ') });

  try {
    const result = await createUser(username, email, password);
    return res.status(201).json({ username: result.username });
  } catch (err) {
    if (err.message && err.message.toLowerCase().includes('exists')) {
      return res.status(409).json({ error: err.message });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/auth/login
 * Authenticate a user and set an HttpOnly cookie with a JWT.
 */
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Missing fields' });

  try {
    const user = await getUserByEmail(email);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

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
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/auth/google
 * Exchange a Google ID token for a local account and issue a JWT.
 */
router.post('/google', async (req, res) => {
  const { id_token } = req.body || {};
  if (!id_token) return res.status(400).json({ error: 'Missing id_token' });

  try {
    const payload = await verifyGoogleIdToken(id_token);
    if (!payload || payload.aud !== GOOGLE_CLIENT_ID) {
      return res.status(401).json({ error: 'Invalid Google ID token' });
    }

    const email = payload.email;
    const name = payload.name || (email ? email.split('@')[0] : 'googleuser');

    let user = await getUserByEmail(email);
    if (!user) {
      const base = String(name).toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 40) || (email ? email.split('@')[0] : 'guser');
      const username = `${base}_${String(payload.sub).slice(-6)}`;
      const randomPassword = crypto.randomBytes(16).toString('hex');
      const created = await createUser(username, email, randomPassword);
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
    return res.status(500).json({ error: 'Google auth failed' });
  }
});

export default router;
