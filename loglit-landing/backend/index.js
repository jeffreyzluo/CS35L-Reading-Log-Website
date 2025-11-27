require('dotenv').config();
const express = require('express');
const cors = require('cors');
const searchRoute = require('./search/searchRoute');
const { addBook } = require('./db');

// Initialize web server
const app = express();

console.log("Environment loaded:", !!process.env.GOOGLE_BOOKS_API_KEY);

// Enable CORS
app.use(cors());  

// Parse JSON bodies
app.use(express.json());

// Routes
app.use('/api/search', searchRoute);
app.post('/api/books/add', async (req, res) => {
  try {
    const {userId, title, author, status, review, rating } = req.body;

    const newBook = await addBook(
      userId,
      title,
      author,
      status,
      review,
      rating
    );

    res.status(200).json(newBook);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message });
});

// Start server
const PORT = 5001;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
