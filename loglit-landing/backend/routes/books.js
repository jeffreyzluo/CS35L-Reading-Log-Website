import express from 'express';
import { addBookToUser, retrieveBook, deleteUserBook } from '../book_user.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

/**
 * POST /api/books/add
 * Adds a book to the authenticated user's library.
 */
router.post('/books/add', authMiddleware, async (req, res) => {
  try {
    const username = req.user.username;
    const bookId = req.body.book_id;
    const { rating, review, status, added_at } = req.body;
    const newBook = await addBookToUser(username, bookId, rating, review, status, added_at);
    res.status(200).json(newBook);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/user_books/:username
 * Retrieve books for a given username.
 */
router.get('/user_books/:username', async (req, res) => {
  try {
    const username = req.params.username;
    const books = await retrieveBook(username);
    res.json(books);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/books/:bookId
 * Deletes a book from the authenticated user's library.
 */
router.delete('/books/:bookId', authMiddleware, async (req, res) => {
  try {
    const username = req.user.username;
    const { bookId } = req.params;
    const result = await deleteUserBook(username, bookId);
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
