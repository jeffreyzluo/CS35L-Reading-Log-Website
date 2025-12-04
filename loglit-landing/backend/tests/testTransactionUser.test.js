/**
 * Examples demonstrating how transactions work in tests
 * 
 * Key concept: ALL operations within a single withTestTransaction() call
 * share the SAME transaction. The transaction only rolls back at the END
 * of the entire test, not after each operation.
 */

import test from 'node:test';
import assert from 'assert';
import {user_queries, book_queries} from '../queries.js'
import { withTestTransaction } from './testTransaction.js';
import {newUser, deleteUser, updateDescription, updateUsername, getUserDetails, getFollowers, getFollowing, addFriend, removeFriend } from '../user.js';
import { addBookToUser, retrieveBook, deleteUserBook } from '../book_user.js';

import {pool} from '../db.js';

test('Test adding a user and rejecting duplicates', async () => {
	// Test 1: Create a new user
	let user = await newUser('user1', 'user1@gmail.com', 'password123', withTestTransaction);
	assert(user.username === 'user1', 'User created with correct username');
	assert(user.date_joined !== undefined, 'User has date_joined field');
	
	// Verify user exists in database
	const userCheck = await pool.query(
		user_queries.userExists,
		[testUsername]
	);
	assert(userCheck.rows.length === 1, 'User exists in database');
	assert(userCheck.rows[0].email === testEmail, 'Email stored correctly');
	assert(userCheck.rows[0].password_hash !== 'password123', 'Password is hashed');

	//Test 2: Trying adding the same user again
	try {
		await newUser(user1, 'different@gmail.com', 'password123', withTestTransaction);
		assert(false, 'Should have thrown error for duplicate username');
	} catch (error) {
		assert(error.message === 'Username already exists', 'Duplicate username rejected');
	}

	// Test 3: Try to create duplicate email
	try {
		await newUser('notUser1', 'user1@gmail.com', 'password123');
		assert(false, 'Should have thrown error for duplicate email');
	} catch (error) {
		assert(error.message === 'Email already exists', 'Duplicate email rejected');
	}
	
	
	//All database commands happen in the same withtestTransaction wrapper, but everything's rolled back, so it doesn't affect actual database. 
});
