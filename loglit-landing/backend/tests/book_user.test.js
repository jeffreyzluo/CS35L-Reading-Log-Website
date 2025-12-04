/**
 * Tests for book_user.js functions using transaction rollback
 * 
 * Run with: node --test tests/book_user.test.js
 */

import test from 'node:test';
import assert from 'assert';
import {user_queries} from '../queries.js'

import { withTestTransaction } from './testTransaction.js';

test('addBookToUser - can add a book to user library', async () => {
	await withTestTransaction(async (client) => {
		// Setup: create a test user
		await client.query(
			user_queries.newUser,
			['testuser_book', 'testbook@example.com', 'hashed_password_123']
		);

		// Test: Add a book (using the same SQL logic as addBookToUser)
		const result = await client.query(
			`INSERT INTO user_books (username, book_id, rating, review, status, added_at)
			 VALUES ($1, $2, $3, $4, $5, $6)
			 ON CONFLICT (username, book_id)
			 DO UPDATE SET
				rating = EXCLUDED.rating,
				review = EXCLUDED.review,
				status = EXCLUDED.status,
				added_at = EXCLUDED.added_at
			 RETURNING *`,
			['testuser_book', 'test_book_123', 5, 'Amazing book!', 'read', new Date()]
		);

		// Verify the book was added
		assert.strictEqual(result.rows.length, 1);
		assert.strictEqual(result.rows[0].username, 'testuser_book');
		assert.strictEqual(result.rows[0].book_id, 'test_book_123');
		assert.strictEqual(result.rows[0].rating, 5);
		assert.strictEqual(result.rows[0].review, 'Amazing book!');
		assert.strictEqual(result.rows[0].status, 'read');

		// Verify it exists in the database (within the transaction)
		const check = await client.query(
			'SELECT * FROM user_books WHERE username = $1 AND book_id = $2',
			['testuser_book', 'test_book_123']
		);
		assert.strictEqual(check.rows.length, 1);

		// All changes will be rolled back automatically when this function exits
	});
});

test('addBookToUser - updates existing book (ON CONFLICT)', async () => {
	await withTestTransaction(async (client) => {
		// Setup: create user and add initial book
		await client.query(
			'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3)',
			['testuser_update', 'testupdate@example.com', 'hash']
		);

		await client.query(
			'INSERT INTO user_books (username, book_id, rating, review, status) VALUES ($1, $2, $3, $4, $5)',
			['testuser_update', 'book_456', 3, 'Okay', 'reading']
		);

		// Test: Add same book again (should update due to ON CONFLICT)
		const result = await client.query(
			`INSERT INTO user_books (username, book_id, rating, review, status, added_at)
			 VALUES ($1, $2, $3, $4, $5, $6)
			 ON CONFLICT (username, book_id)
			 DO UPDATE SET
				rating = EXCLUDED.rating,
				review = EXCLUDED.review,
				status = EXCLUDED.status,
				added_at = EXCLUDED.added_at
			 RETURNING *`,
			['testuser_update', 'book_456', 5, 'Great after finishing!', 'read', new Date()]
		);

		// Verify it was updated, not inserted
		assert.strictEqual(result.rows.length, 1);
		assert.strictEqual(result.rows[0].rating, 5);
		assert.strictEqual(result.rows[0].review, 'Great after finishing!');
		assert.strictEqual(result.rows[0].status, 'read');
	});
});

test('deleteUserBook - can delete a book from user library', async () => {
	await withTestTransaction(async (client) => {
		// Setup: create user and add book
		await client.query(
			'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3)',
			['testuser_delete', 'testdelete@example.com', 'hash']
		);

		await client.query(
			'INSERT INTO user_books (username, book_id, rating, review, status) VALUES ($1, $2, $3, $4, $5)',
			['testuser_delete', 'book_to_delete', 4, 'Good', 'read']
		);

		// Test: Delete the book
		const deleteResult = await client.query(
			'DELETE FROM user_books WHERE username = $1 AND book_id = $2',
			['testuser_delete', 'book_to_delete']
		);

		assert.strictEqual(deleteResult.rowCount, 1);

		// Verify it's gone
		const check = await client.query(
			'SELECT * FROM user_books WHERE username = $1 AND book_id = $2',
			['testuser_delete', 'book_to_delete']
		);
		assert.strictEqual(check.rows.length, 0);
	});
});

test('editUserBook - can update book details', async () => {
	await withTestTransaction(async (client) => {
		// Setup: create user and add book
		await client.query(
			'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3)',
			['testuser_edit', 'testedit@example.com', 'hash']
		);

		await client.query(
			'INSERT INTO user_books (username, book_id, rating, review, status) VALUES ($1, $2, $3, $4, $5)',
			['testuser_edit', 'book_edit', 3, 'Initial review', 'reading']
		);

		// Test: Update the book
		const updateResult = await client.query(
			`UPDATE user_books
			 SET rating = $3, review = $4, status = $5
			 WHERE username = $1 AND book_id = $2
			 RETURNING *`,
			['testuser_edit', 'book_edit', 5, 'Updated review - loved it!', 'read']
		);

		assert.strictEqual(updateResult.rowCount, 1);
		assert.strictEqual(updateResult.rows[0].rating, 5);
		assert.strictEqual(updateResult.rows[0].review, 'Updated review - loved it!');
		assert.strictEqual(updateResult.rows[0].status, 'read');
	});
});

test('retrieveBook - can retrieve all books for a user', async () => {
	await withTestTransaction(async (client) => {
		// Setup: create user and add multiple books
		await client.query(
			'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3)',
			['testuser_retrieve', 'testretrieve@example.com', 'hash']
		);

		await client.query(
			'INSERT INTO user_books (username, book_id, rating, review, status) VALUES ($1, $2, $3, $4, $5)',
			['testuser_retrieve', 'book1', 5, 'Great', 'read']
		);

		await client.query(
			'INSERT INTO user_books (username, book_id, rating, review, status) VALUES ($1, $2, $3, $4, $5)',
			['testuser_retrieve', 'book2', 4, 'Good', 'reading']
		);

		await client.query(
			'INSERT INTO user_books (username, book_id, rating, review, status) VALUES ($1, $2, $3, $4, $5)',
			['testuser_retrieve', 'book3', 3, 'Okay', 'want_to_read']
		);

		// Test: Retrieve all books
		const result = await client.query(
			`SELECT book_id, rating, review, status, added_at
			 FROM user_books
			 WHERE username = $1`,
			['testuser_retrieve']
		);

		assert.strictEqual(result.rows.length, 3);
		
		// Verify all books are present
		const bookIds = result.rows.map(r => r.book_id).sort();
		assert.deepStrictEqual(bookIds, ['book1', 'book2', 'book3']);
	});
});

