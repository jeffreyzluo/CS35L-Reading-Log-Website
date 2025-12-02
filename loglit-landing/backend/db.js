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



// Function to retrieve all books for a user
const retrieveBooks = async (userId) => {
	try {
		const result = await pool.query('SELECT * FROM books WHERE user_id = $1 ORDER BY date_added DESC', [userId]);
		return result.rows;
	} catch (error) {
		throw error;
	}
};

export { withTransaction, pool, getUserByEmail, newUser};