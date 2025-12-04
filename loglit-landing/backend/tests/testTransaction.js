import { pool } from '../db.js';

/**
 * Wraps a test function in a transaction that automatically rolls back.
 * All database operations within the callback will be rolled back after the test.
 */
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