require('dotenv').config();
const express = require('express');
const cors = require('cors');
const searchRoute = require('./search/searchRoute');

const app = express();

console.log(process.env.GOOGLE_BOOKS_API_KEY);

// Enable CORS for all origins (development-friendly)
app.use(cors());  

// Parse JSON bodies
app.use(express.json());

// Routes
app.use('/api/search', searchRoute);

// Error handler (optional)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message });
});

// Start server
const PORT = 5001;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
