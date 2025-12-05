/**
 * Wraps a test function in a transaction that automatically rolls back.
 * All database operations within the callback will be rolled back after the test.
 */

import {Pool} from 'pg';
import dotenv from 'dotenv';
dotenv.config({path: "../../.env"});

// Prefer a single DATABASE_URL when available
const poolConfig = {};
poolConfig.user = process.env.PGUSER || undefined;
poolConfig.host = process.env.PGHOST || 'localhost';
poolConfig.database = process.env.PGDATABASE || 'readinglog';
poolConfig.password = process.env.PGPASSWORD || undefined;
poolConfig.port = process.env.PGPORT ? parseInt(process.env.PGPORT, 10) : 5432;

export const pool = new Pool(poolConfig);

export async function withTestTransaction(testFn) {
	const client = await pool.connect();
	try {
		await client.query('BEGIN');
		const result = await testFn(client);
		// Always rollback - never commit in tests
		await client.query('ROLLBACK');
		return result;
	} catch (err) {
		// Rollback on error too
		await client.query('ROLLBACK').catch(() => {
			// Ignore rollback errors if transaction already failed
		});
		throw err;
	} finally {
		client.release();
	}
}