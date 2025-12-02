/*
	ESM-style DB helper for readinglog app
*/
import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config();

// Prefer a single DATABASE_URL when available
const poolConfig = {};
if (process.env.DATABASE_URL) {
	poolConfig.connectionString = process.env.DATABASE_URL;
	if (process.env.DB_SSL === 'true') {
		poolConfig.ssl = { rejectUnauthorized: false };
	}
} else {
	poolConfig.user = process.env.PGUSER || undefined;
	poolConfig.host = process.env.PGHOST || 'localhost';
	poolConfig.database = process.env.PGDATABASE || 'readinglog';
	poolConfig.password = process.env.PGPASSWORD || undefined;
	poolConfig.port = process.env.PGPORT ? parseInt(process.env.PGPORT, 10) : 5432;
}

const pool = new Pool(poolConfig);

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

// Get user by email (used for login)
const getUserByEmail = async (email) => {
	try {
		const result = await pool.query(
			'SELECT username, email, password_hash FROM users WHERE email = $1',
			[email]
		);
		return result.rows[0] || null;
	} catch (error) {
		throw error;
	}
};

// Function to add a new user
const newUser = async (username, email, passwordHash) => {
	try {
		const userCheck = await pool.query(
			'SELECT username, email FROM users WHERE username = $1 OR email = $2',
			[username, email]
		);

		if (userCheck.rows.length > 0) {
			const existing = userCheck.rows[0];
			if (existing.username === username) throw new Error('Username already exists');
			if (existing.email === email) throw new Error('Email already exists');
		}

		const result = await pool.query(
			'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING username, email',
			[username, email, passwordHash]
		);

		return result.rows[0];
	} catch (error) {
		throw error;
	}
};

// Function to add a new book
const addBook = async (userId, title, author, status = null, review = null, rating = null) => {
	try {
		const userCheck = await pool.query('SELECT id FROM users WHERE id = $1', [userId]);
		if (userCheck.rows.length === 0) throw new Error('User does not exist');
		if (!title) throw new Error('Title is required');
		if (rating !== null && (rating < 1 || rating > 5)) throw new Error('Rating must be between 1 and 5');

		const result = await pool.query(
			'INSERT INTO books (user_id, title, author, status, review, rating) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
			[userId, title, author || null, status || null, review || null, rating || null]
		);

		return result.rows[0];
	} catch (error) {
		throw error;
	}
};

// Function to update a book
const updateBook = async (bookId, updates) => {
	try {
		const currentBook = await pool.query('SELECT * FROM books WHERE id = $1', [bookId]);
		if (currentBook.rows.length === 0) throw new Error('Book not found');
		const book = currentBook.rows[0];

		const newData = {
			title: updates.title || book.title,
			author: updates.author !== undefined ? updates.author : book.author,
			status: updates.status !== undefined ? updates.status : book.status,
			review: updates.review !== undefined ? updates.review : book.review,
			rating: updates.rating !== undefined ? updates.rating : book.rating,
		};

		if (newData.rating !== null && (newData.rating < 1 || newData.rating > 5)) throw new Error('Rating must be between 1 and 5');

		const result = await pool.query(
			`UPDATE books SET title = $2, author = $3, status = $4, review = $5, rating = $6 WHERE id = $1 RETURNING *`,
			[bookId, newData.title, newData.author, newData.status, newData.review, newData.rating]
		);

		return result.rows[0];
	} catch (error) {
		throw error;
	}
};

// Function to retrieve all books for a user
const retrieveBooks = async (userId) => {
	try {
		const result = await pool.query('SELECT * FROM books WHERE user_id = $1 ORDER BY date_added DESC', [userId]);
		return result.rows;
	} catch (error) {
		throw error;
	}
};

export { withTransaction, pool, getUserByEmail, newUser, addBook, updateBook, retrieveBooks };