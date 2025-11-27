import { withTransaction } from './db.js';
const pool = require('./db.js');
const bcrypt = require('bcrypt');


/*
CREATE TABLE user_books (
    username    VARCHAR(50) REFERENCES users(username) ON DELETE CASCADE,   
    book_id     UUID REFERENCES books(book_id) ON DELETE CASCADE,
    rating      INT,
    review      TEXT,
    status      TEXT,
    added_at    TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (username, book_id)
);*/


export async function addBookToUser(username, bookId, rating, review, status, added_at) {
    return withTransaction(async (client) => {
        const result = await client.query(
            'INSERT INTO user_books (username, book_id, rating, review, status, added_at) VALUES ($1, $2, $3, $4, $5)',
            [username, bookId, rating, review, status, added_at]
        );
        return result.rows;
    });
}

export async function deleteUserBook (username, bookId) {
    return withTransaction(async (client) => {
        const result = await client.query('DELETE FROM user_books WHERE username = $1 AND bookId = $2',
            [username, bookId]
        );
        if (result.rowCount === 0) {
            throw new Error("User not found");
        }
        return { username, deleted: true };
    });
}

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
