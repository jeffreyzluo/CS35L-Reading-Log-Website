import dotenv from 'dotenv';
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import { fileURLToPath } from 'url';
import searchRoute from './search/searchRoute.js';
import authRouter from './routes/auth.js';
import booksRouter from './routes/books.js';
import userRouter from './routes/user.js';
import publicUsersRouter from './routes/publicUsers.js';
import recommendationRouter from './routes/recommendation.js';
import authMiddleware from './middleware/auth.js';

dotenv.config();

const app = express();
app.use(bodyParser.json());

// Enable CORS for the frontend during development and allow cookies
const frontendOrigin = process.env.FRONTEND_ORIGIN || 'http://localhost:3000';
app.use(cors({ origin: frontendOrigin, credentials: true }));

// Mount routers
app.use('/api/auth', authRouter);
app.use('/api', booksRouter); // contains /books/add, /books/:bookId, /user_books/:username
app.use('/api/user', userRouter); // user-specific actions (protected)
app.use('/api/users', publicUsersRouter); // public user endpoints and search
app.use('/api/recommendation', recommendationRouter);
app.use('/api/search', searchRoute);

// simple protected endpoints kept for debugging/compatibility
app.get('/api/protected', authMiddleware, (req, res) => {
  return res.status(200).json({ username: req.user.username });
});

app.get('/api/me', authMiddleware, (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  res.json({ username: req.user.username });
});


// Error handler
app.use((err, req, res, next) => {
  res.status(err.status || 500).json({ error: err.message });
});

// If invoked directly, start the server. Otherwise export the app for tests.
const __filename = fileURLToPath(import.meta.url);
if (process.argv[1] === __filename) {
  const port = process.env.PORT || 3001;
  app.listen(port, () => {
  });
}

export default app;
