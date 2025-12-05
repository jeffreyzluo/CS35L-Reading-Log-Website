import test from 'node:test';
import assert from 'assert';
import {user_queries, book_queries} from '../queries.js'
import { withTestTransaction } from './testTransaction.js';
import { createTestTxWrapper } from './testHelpers.js';
import {newUser, deleteUser, updateDescription, updateUsername, getUserDetails, getFollowers, getFollowing, addFriend, removeFriend } from '../user.js';
import { addBookToUser, retrieveBook, deleteUserBook } from '../book_user.js';
import { pool } from './testTransaction.js';

test('Test adding, updating and deleting books', async () => {
    await withTestTransaction(async (client) => {
        // Transaction wrapper
        const tx = createTestTxWrapper(client);

        // 1️⃣ Create a user
        let user = await newUser('user1', 'user1@gmail.com', 'password123', tx);
        assert.strictEqual(user.username, 'user1', 'User created with correct username');

        // 2️⃣ Add two books
        let book1 = await addBookToUser('user1', '0001', 5, 'I love this book!', 'Completed', new Date(), tx);
        let book2 = await addBookToUser('user1', '0002', 4, 'This one was okay.', 'Completed', new Date(), tx);

        // 3️⃣ Retrieve books and assert they exist
        let books = await retrieveBook('user1', tx);
        assert.strictEqual(books.length, 2, 'User has 2 books');

        // 4️⃣ Assert first book details
        let b1 = books.find(b => b.book_id === '0001');
        assert(b1, 'Book 0001 exists');
        assert.strictEqual(b1.rating, 5);
        assert.strictEqual(b1.review, 'I love this book!');
        assert.strictEqual(b1.status, 'Completed');

        // 5️⃣ Assert second book details
        let b2 = books.find(b => b.book_id === '0002');
        assert(b2, 'Book 0002 exists');
        assert.strictEqual(b2.rating, 4);
        assert.strictEqual(b2.review, 'This one was okay.');
        assert.strictEqual(b2.status, 'Completed');

        // 6️⃣ Update second book
        await addBookToUser('user1', '0002', 5, 'Actually better than I thought', 'Completed', new Date(), tx);

        // 7️⃣ Retrieve again and check updated book
        let updatedBooks = await retrieveBook('user1', tx);
        let updatedB2 = updatedBooks.find(b => b.book_id === '0002');
        assert.strictEqual(updatedB2.rating, 5, 'Book 0002 rating updated');
        assert.strictEqual(updatedB2.review, 'Actually better than I thought', 'Book 0002 review updated');
        assert.strictEqual(updatedB2.status, 'Completed', 'Book 0002 status remains Completed');

        // ✅ Optional: check first book is unchanged
        let unchangedB1 = updatedBooks.find(b => b.book_id === '0001');
        assert.strictEqual(unchangedB1.rating, 5);
        assert.strictEqual(unchangedB1.review, 'I love this book!');
    });
});


test("Retrieving books via different methods", async () => {
    await withTestTransaction(async (client) => {
		const tx = createTestTxWrapper(client);

        // 1️⃣ Create a user
        let user = await newUser('user1', 'user1@gmail.com', 'password123', tx);
        assert.strictEqual(user.username, 'user1', 'User created with correct username');
        
        let book1 = await addBookToUser('user1', '0001', 5, 'I love this book!', "Completed", new Date(), tx);
        let books1 = await retrieveBook('user1', tx);
        assert.strictEqual(books1.length, 1);

        let book2 = await addBookToUser('user1', '0002', 4, 'This one was okay.', 'Completed', new Date(), tx);
        let books2 = await retrieveBook('user1', tx);
        assert.strictEqual(books2.length, 2);
        
        let book3 = await addBookToUser('user1', '0003', 3, 'Not that good. Plot was boring.', 'Completed', new Date(), tx);
        let books3 = await retrieveBook('user1', tx);
        assert.strictEqual(books3.length, 3);
    });
});