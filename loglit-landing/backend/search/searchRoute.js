const express = require('express');
const { searchBooks } = require('./searchController');
const router = express.Router();

// GET
router.get('/', async (req, res, next) => {
  try {
    // Call controller to handle search logic
    await searchBooks(req, res, next);
  } catch (err) {
    // Forwars errors to global error handler in indes.js
    next(err);
  }
});

module.exports = router;