const { fetchBooks } = require('./searchService');

async function searchBooks(req, res, next) {
  
  try {
    const query = req.query.q;

    if (!query) {
      const err = new Error('Missing search query');
      err.status = 400;
      throw err;
    }

    // Call Google Books API
    const results = await fetchBooks(query);
    
    res.json(results);
  } catch (err) {
    next(err);
  }
}

module.exports = { searchBooks };