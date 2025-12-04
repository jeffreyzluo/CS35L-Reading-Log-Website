import { withTransaction } from './db.js';

/*
CREATE TABLE user_books (
    username    VARCHAR(50) REFERENCES users(username) ON DELETE CASCADE,   
    book_id     UUID,
    rating      INT,
    review      TEXT,
    status      TEXT,
    added_at    TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (username, book_id)
);*/

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
export async function addBookToUser(username, bookId, rating, review, status, added_at) {
    return withTransaction(async (client) => {
        const result = await client.query(
            'INSERT INTO user_books (username, book_id, rating, review, status, added_at) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [username, bookId, rating, review, status, added_at]
        );
        return result.rows[0];
    });
}

/**
 * Delete a user's book entry.
 * @param {string} username
 * @param {string} bookId
 * @returns {Promise<{username:string,deleted:boolean}>}
 */
export async function deleteUserBook (username, bookId) {
    return withTransaction(async (client) => {
        const result = await client.query('DELETE FROM user_books WHERE username = $1 AND book_id = $2',
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
export async function editUserBook(username, bookId, rating, review, status) {
    return withTransaction(async (client) => {
        const result = await client.query(
            `UPDATE user_books
             SET rating = $3,
                 review = $4,
                 status = $5
             WHERE username = $1 AND book_id = $2
             RETURNING *`,
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
export async function retrieveBook(username) {
    return withTransaction(async (client) => {
        const result = await client.query(
            `SELECT book_id, rating, review, status, added_at
             FROM user_books
             WHERE username = $1`,
            [username]
        );

        return result.rows;
    });
}
