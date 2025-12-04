import { withTransaction } from './db.js';
import {book_queries} from './queries.js';

/**
 * Add a book record for a specific user.
 * @param {string} username
 * @param {string} bookId
 * @param {number|null} rating
 * @param {string|null} review
 * @param {string|null} status
 * @param {string|Date|null} added_at
 * @returns {Promise<Object>} Inserted user_book row
 */
//Note: For all functions, we have a transaction wrapper for ACID management and testing purposes.
//withTransaction wrapper will be used as default, and withTestTransaction can be passed in for testing database oeprations.

export async function addBookToUser(username, bookId, rating, review, status, added_at, tx = withTransaction) {
    return tx(async (client) => {
        const checkExisting = await client.query(
            'SELECT * FROM user_books WHERE username = $1 AND book_id = $2',
            [username, bookId]
        );
        let query = book_queries.addUserBook;
        let result;
        if (checkExisting.rows.length > 0) {
            //Book already exists, perform update instead
            query = book_queries.editUserBook;
            const result = await client.query(
                query,
                [username, bookId, rating, review, status]
            );
        } else {
            const result = await client.query(
                query,
                [username, bookId, rating, review, status, added_at]
            );
        }
    });
}

/**
 * Delete a user's book entry.
 * @param {string} username
 * @param {string} bookId
 * @returns {Promise<{username:string,deleted:boolean}>}
 */
export async function deleteUserBook (username, bookId, tx = withTransaction) {
    return tx(async (client) => {
        const result = await client.query(book_queries.deleteUserBook,
            [username, bookId]
        );
        if (result.rowCount === 0) {
            throw new Error("User book not found");
        }
        return { username, deleted: true };
    });
}

/**
 * Edit an existing user book record.
 * @param {string} username
 * @param {string} bookId
 * @param {number|null} rating
 * @param {string|null} review
 * @param {string|null} status
 * @returns {Promise<Object>} Updated row
 */
export async function editUserBook(username, bookId, rating, review, status, tx = withTransaction) {
    return tx(async (client) => {
        const result = await client.query(
            book_queries.editUserBook,
            [username, bookId, rating, review, status]
        );

        if (result.rowCount === 0) {
            throw new Error("User book not found");
        }

        return result.rows[0];
    });
}

/**
 * Retrieve all books for a user.
 * @param {string} username
 * @returns {Promise<Array<{book_id:string,rating:number,review:string,status:string,added_at:Date}>>}
 */
export async function retrieveBook(username, tx = withTransaction) {
    return tx(async (client) => {
        const result = await client.query(
            book_queries.retrieveBook,
            [username]
        );

        return result.rows;
    });
}