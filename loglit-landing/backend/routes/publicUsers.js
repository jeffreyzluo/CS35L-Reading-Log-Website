import express from 'express';
import { getUserDetails } from '../user.js';
import { pool } from '../db.js';

const router = express.Router();

/**
 * GET /api/users/:username
 * Returns public user info for a given username.
 */
router.get('/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const user = await getUserDetails(username);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ username: user.username, description: user.description || '' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/users/search?q=...
 * Search for usernames (autocomplete).
 */
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim() === '') return res.status(200).json({ users: [] });

    const result = await pool.query(
      'SELECT username FROM users WHERE username ILIKE $1 LIMIT 10',
      [`%${q.trim()}%`]
    );

    res.status(200).json({ users: result.rows.map(row => row.username) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
