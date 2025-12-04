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

/**
 * Run a callback inside a database transaction.
 * The callback receives a connected `pg` client and may perform queries.
 * The transaction is committed if the callback resolves, or rolled back on rejection.
 * @param {(client: import('pg').PoolClient) => Promise<any>} callback
 * @returns {Promise<any>} The value returned by the callback.
 */
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

/**
 * Retrieve a user row by email.
 * @param {string} email - Email address to look up.
 * @returns {Promise<{username:string,email:string,password_hash:string}|null>} User row or null if not found.
 */
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

/**
 * Insert a new user row. This is a low-level helper that expects the
 * caller to provide a pre-hashed password. It performs a basic uniqueness
 * check and returns the created user row.
 * @param {string} username
 * @param {string} email
 * @param {string} passwordHash
 * @returns {Promise<{username:string,email:string}>}
 */
const insertUserRow = async (username, email, passwordHash) => {
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

// Export the low-level insert function and keep `newUser` as an alias
export { withTransaction, pool, getUserByEmail, insertUserRow, insertUserRow as newUser };