const { fetchBooks } = require('./searchService');

async function searchBooks(req, res, next) {
  
  try {
    const query = req.query.q;

    if (!query) {
      const err = new Error('Missing search query');
      err.status = 400;
      throw err;
    }

    console.log('--- LOG A (Controller): Attempting to call fetchBooks ---');

    const results = await fetchBooks(query);

    console.log('--- LOG C (Controller): fetchBooks returned successfully ---');
    
    res.json(results);
  } catch (err) {
    next(err);
  }
}

module.exports = { searchBooks };