//This file includes all the tests for the database

import test from 'node:test';
import assert from 'assert';
import {user_queries, book_queries} from '../queries.js'
import { withTestTransaction } from './testTransaction.js';
import { createTestTxWrapper } from './testHelpers.js';
import {newUser, deleteUser, updateDescription, updateUsername, getUserDetails, getFollowers, getFollowing, addFriend, removeFriend } from '../user.js';
import { addBookToUser, retrieveBook, deleteUserBook } from '../book_user.js';
import { pool } from './testTransaction.js';

/* Initial AI prompt to generate initial version of the code boilerplate template:
	Given user.js and testTransaction.js files, write a test file testTransactionUser.test.js that uses withTestTransaction to test user-related database operations.
	Make sure that your tests test all operations in user.js. Using the logic in testTransaction.js, make sure that all tests include transaction rollback and don't actually modify the database.
*/

test('Test adding a user and rejecting duplicates', async () => {
	await withTestTransaction(async (client) => {
		// Create a transaction wrapper that uses the same client for all operations
		const tx = createTestTxWrapper(client);
		
		// Test 1: Create a new user
		let user = await newUser('user1', 'user1@gmail.com', 'password123', tx);
		assert(user.username === 'user1', 'User created with correct username');
		assert(user.date_joined !== undefined, 'User has date_joined field');
		
		// Verify user exists in database
		const userCheck = await client.query(
			user_queries.userExists,
			['user1']
		);
		
		assert(userCheck.rows.length === 1, 'User exists in database');

		//If user exists, retrieve details and verify they are correct
		const getUserDetail = await client.query(
			user_queries.getUserDetails,
			['user1']
		);
		
		assert(getUserDetail.rows[0].email === 'user1@gmail.com', 'Email stored correctly');
		assert(getUserDetail.rows[0].password_hash !== 'password123', 'Password is hashed');

		//Test 2: Try to create a duplicate user
		try {
			await newUser('user1', 'different@gmail.com', 'password123', tx);
			assert(false, 'Should have thrown error for duplicate username');
		} catch (error) {
			assert(error.message === 'Username already exists', 'Duplicate username rejected');
		}
		
		//Test 3: Try to create a user with a duplicate email
		try {
			await newUser('notUser1', 'user1@gmail.com', 'password123', tx);
			assert(false, 'Should have thrown error for duplicate email');
		} catch (error) {
			assert(error.message === 'Email already exists', 'Duplicate email rejected');
		}

		//Test 4: Try to delete a user
		const deleteResult = await deleteUser('user1', tx);
		assert(deleteResult.deleted === true, 'Delete returns success');

		//Test 5: Try to delete a non-existent user
		try {
			const deleteResult = await deleteUser('user1', tx);
			assert(deleteResult.deleted === false, 'Delete should be invalid, user does not exist');
			const deletedCheck = await client.query(
				'SELECT * FROM users WHERE username = $1',
				['user1']
			);
			assert(deletedCheck.rows.length === 0, 'User removed from database');
		} catch (error) {
			assert(error.message === 'Error deleting user', 'User deletion rejected');
		}

	});
});

test('Test multiple related operations: create users, add friend, check followers', async () => {
	await withTestTransaction(async (client) => {
		// Create a single transaction wrapper for all operations
		const tx = createTestTxWrapper(client);
		
		// Step 1: Create two users
		const user1 = await newUser('alice', 'alice@test.com', 'password123', tx);
		const user2 = await newUser('bob', 'bob@test.com', 'password123', tx);
		
		assert(user1.username === 'alice', 'User1 created');
		assert(user2.username === 'bob', 'User2 created');
		
		// Test 2: Alice adds Bob as a friend
		const friendResult = await addFriend('alice', 'bob', tx);
		assert(friendResult !== null, 'Friend added successfully');
		
		// Test 3: Check that Bob has Alice as a follower
		const bobFollowers = await getFollowers('bob', tx);
		assert(bobFollowers.length === 1, 'Bob has one follower');
		assert(bobFollowers[0].user_username === 'alice', 'Alice is following Bob');
		
		// Test 4: Check that Alice is following Bob
		const aliceFollowing = await getFollowing('alice', tx);
		assert(aliceFollowing.length === 1, 'Alice is following one person');
		assert(aliceFollowing[0].friend_username === 'bob', 'Alice is following Bob');
		
		// Test 5: Try to add duplicate friend (should fail)
		try {
			await addFriend('alice', 'bob', tx);
			assert(false, 'Should have thrown error for duplicate friend');
		} catch (error) {
			// Expected to fail
			assert(error !== null, 'Duplicate friend rejected');
		}
		
		// Test 6: Remove friend
		const removeResult = await removeFriend('alice', 'bob', tx);
		assert(removeResult.deleted === true, 'Friend removed successfully');
		
		// Test 7: Verify Bob has no followers now
		const bobFollowersAfter = await getFollowers('bob', tx);
		assert(bobFollowersAfter.length === 0, 'Bob has no followers after removal');
		
		//The good thing about the test is that with testTransaction, all these operations happened in the same transaction.
		// Each transaction can basically see each other's changes, but everything rolls back at the end.
	});
});

test('Test user profile operations: update description and username', async () => {
	await withTestTransaction(async (client) => {
		const tx = createTestTxWrapper(client);
		
		// Create a user
		const user = await newUser('charlie', 'charlie@test.com', 'password123', tx);
		
		// Update description
		const updatedDesc = await updateDescription('charlie', 'I love reading!', tx);
		assert(updatedDesc.description === 'I love reading!', 'Description updated');
		
		// Get user details and verify description
		const details = await getUserDetails('charlie', tx);
		assert(details.description === 'I love reading!', 'Description persisted');
		
		// Update username
		const updatedUser = await updateUsername('charlie', 'charlie_new', tx);
		assert(updatedUser.username === 'charlie_new', 'Username updated');
		
		// Verify old username doesn't exist
		const oldDetails = await getUserDetails('charlie', tx);
		assert(oldDetails === null, 'Old username no longer exists');
		
		// Verify new username exists
		const newDetails = await getUserDetails('charlie_new', tx);
		assert(newDetails.username === 'charlie_new', 'New username exists');
		assert(newDetails.description === 'I love reading!', 'Description preserved after username change');
	});
});