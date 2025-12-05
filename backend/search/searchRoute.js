import express from 'express';
import { searchBooks } from './searchController.js';

const router = express.Router();

// GET
router.get('/', async (req, res, next) => {
  try {
    // Call controller to handle search logic
    await searchBooks(req, res, next);
  } catch (err) {
    // Forwards errors to global error handler
    next(err);
  }
});

// Note: the controller `searchBooks` expects a query param `q` and returns
// an array of simplified book objects. This route is intentionally thin —
// the controller contains the core logic and error handling.

export default router;