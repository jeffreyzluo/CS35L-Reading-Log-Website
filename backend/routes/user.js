import express from 'express';
import jwt from 'jsonwebtoken';
import authMiddleware from '../middleware/auth.js';
import { updateDescription, updateUsername, getUserDetails, getFollowers, getFollowing, addFriend, deleteUser } from '../user.js';

const router = express.Router();

/**
 * PUT /api/user/username
 * Change the authenticated user's username.
 */
router.put('/username', authMiddleware, async (req, res) => {
  try {
    const username = req.user.username;
    const { newUsername } = req.body;
    const result = await updateUsername(username, newUsername);
    // Create a new JWT so the authenticated identity matches the updated username
    try {
      const updated = await getUserDetails(result.username);
      const JWT_SECRET = process.env.JWT_SECRET;
      const tokenPayload = { username: updated.username, email: updated.email };
      const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '1h' });
      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 1000,
      };
      res.cookie('jwt', token, cookieOptions);
      // Return the updated user and the new token (client may store token in localStorage if it uses that)
      res.status(200).json({ user: result, token });
    } catch (err) {
      // If creating token or fetching updated user fails, still return success for username update
      res.status(200).json(result);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/user/:username/description
 * Get a user's public description.
 */
router.get('/:username/description', async (req, res) => {
  try {
    const username = req.params.username;
    const userDetails = await getUserDetails(username);
    res.status(200).json({ description: userDetails?.description || '' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * PUT /api/user/description
 * Update the authenticated user's description.
 */
router.put('/description', authMiddleware, async (req, res) => {
  try {
    const username = req.user.username;
    const { description } = req.body;
    const result = await updateDescription(username, description);
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/user/:username/followers
 * GET /api/user/:username/following
 */
router.get('/:username/followers', async (req, res) => {
  try {
    const username = req.params.username;
    const followers = await getFollowers(username);
    res.status(200).json({ followers: followers.map(f => f.user_username), count: followers.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:username/following', async (req, res) => {
  try {
    const username = req.params.username;
    const following = await getFollowing(username);
    res.status(200).json({ following: following.map(f => f.friend_username), count: following.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/user/friends
 * Add a friend for the authenticated user.
 */
router.post('/friends', authMiddleware, async (req, res) => {
  try {
    const username = req.user.username;
    const { friendUsername } = req.body;

    if (!friendUsername || friendUsername.trim() === '') {
      return res.status(400).json({ error: 'Friend username is required' });
    }

    if (friendUsername === username) {
      return res.status(400).json({ error: 'Cannot add yourself as a friend' });
    }

    const friendDetails = await getUserDetails(friendUsername.trim());
    if (!friendDetails) return res.status(404).json({ error: 'User not found' });

    const following = await getFollowing(username);
    if (following.some(f => f.friend_username === friendUsername.trim())) {
      return res.status(409).json({ error: 'Already following this user' });
    }

    const result = await addFriend(username, friendUsername.trim());
    res.status(200).json({ message: 'Friend added successfully', friend: result });
  } catch (err) {
    if (err.code === '23505') {
      res.status(409).json({ error: 'Already following this user' });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

/**
 * DELETE /api/user
 * Delete the authenticated user's account.
 */
router.delete('/', authMiddleware, async (req, res) => {
  try {
    const username = req.user.username;
    await deleteUser(username);
    // Clear the authentication cookie so the client is logged out
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    };
    res.clearCookie('jwt', cookieOptions);
    res.status(200).json({ message: 'Account deleted' });
  } catch (err) {
    if (err.message === 'User not found') {
      res.status(404).json({ error: 'User not found' });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

export default router;

