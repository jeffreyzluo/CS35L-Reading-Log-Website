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

export default router;