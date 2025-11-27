/*
    Create a database that stores the following information:
        - Username
        - Email
        - Hashed Password
        - Profile photo
        - Date Joined
        - Books
        - Each Book should have:
            - Title
            - Author
            - Date Added 
            - personal review
            - Rating (1-5 stars)
*/

import bcrypt from 'bcrypt';
import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'readinglog',
  password: process.env.PGPASSWORD,
  port: 5432,
});

async function withTransaction(callback) {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const result = await callback(client);

        await client.query('COMMIT');

        return result;
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
}

//Book operations (yet to convert into book_operations.js file)

// Function to add a new book
export const addBook = async (book_id, username, title, author, review = null, rating = null, date_added=Date.now(), genre=null) => {
    try {
        // Check if user exists
        const userCheck = await pool.query(
            'SELECT username FROM users WHERE username = $1',
            [username]
        );
        
        //Check if title exists
        const bookCheck = await pool.query(
            'SELECT title, author FROM books WHERE title = $1 AND ',
            [title]
        )
        
        //Check if user owns the book already
        const checkOwner = await pool.query(
            'SELECT username FROM user_books WHERE username= $1 AND book_id = $2',
            [username, book_id]
        )
        if (userCheck.rows.length === 0) {
            throw new Error('User does not exist');
        }
        if (bookCheck.rows.length > 0) {
            throw new Error('Book title already exists');
        }
        // Validate required fields
        if (!title) {
            throw new Error('Title is required');
        }
        
        // Validate rating if provided
        if (rating !== null && (rating < 1 || rating > 5)) {
            throw new Error('Rating must be between 1 and 5');
        }

        const result = await pool.query(
            'INSERT INTO books (user_id, title, author, status, review, rating) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [userId, title, author || null, review || null, rating || null]
        );

        return result.rows[0];
    } catch (error) {
        throw error;
    }
};

// Function to update a book
export const updateBook = async (bookId, updates) => {
    try {
        // Get current book data
        const currentBook = await pool.query(
            'SELECT * FROM books WHERE id = $1',
            [bookId]
        );

        if (currentBook.rows.length === 0) {
            throw new Error('Book not found');
        }

        const book = currentBook.rows[0];

        // Merge updates with current data, keeping existing values if updates not provided
        const newData = {
            title: updates.title || book.title,
            author: updates.author !== undefined ? updates.author : book.author,
            status: updates.status !== undefined ? updates.status : book.status,
            review: updates.review !== undefined ? updates.review : book.review,
            rating: updates.rating !== undefined ? updates.rating : book.rating
        };

        // Validate rating if it's being updated
        if (newData.rating !== null && (newData.rating < 1 || newData.rating > 5)) {
            throw new Error('Rating must be between 1 and 5');
        }

        const result = await pool.query(
            `UPDATE books 
             SET title = $2, author = $3, status = $4, review = $5, rating = $6 
             WHERE id = $1 
             RETURNING *`,
            [bookId, newData.title, newData.author, newData.status, newData.review, newData.rating]
        );

        return result.rows[0];
    } catch (error) {
        throw error;
    }
};

export const deleteBook = async (bookId) => {
    try {
        const result = await pool.query(
            'DELETE FROM books WHERE id = $1 RETURNING *',
            [bookId]
        );
    } catch (error) {
        throw error;
    }
}

// Function to retrieve all books for a user
export const retrieveBooks = async (userId) => {
    try {
        const result = await pool.query(
            'SELECT * FROM books WHERE user_id = $1 ORDER BY date_added DESC',
            [userId]
        );

        return result.rows;
    } catch (error) {
        throw error;
    }
};

export {
    withTransaction,
    pool,
};