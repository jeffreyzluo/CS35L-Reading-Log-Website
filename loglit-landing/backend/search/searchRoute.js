const express = require('express');
const { searchBooks } = require('./searchController');
const router = express.Router();

// GET
router.get('/', async (req, res, next) => {
  try {
    // Get query from frontend
    const query = req.query.q; 

    if (!query) {
      // If no query given, throw a 400 error
      const err = new Error('Missing search query');
      err.status = 400;
      throw err;
    }

    // Call controller to handle search logic
    await searchBooks(req, res, next);
  } catch (err) {
    // Forwars errors to global error handler in indes.js
    next(err);
  }
});

module.exports = router;