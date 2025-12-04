import express from 'express';
import authMiddleware from '../middleware/auth.js';
import { updateDescription, updateUsername, getUserDetails, getFollowers, getFollowing, addFriend } from '../user.js';

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
    res.status(200).json(result);
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

export default router;
