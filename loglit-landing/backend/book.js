import { withTransaction } from './db.js';
import {pool } from './db.js';

/**
 * Add a book to the global `books` table.
 * @param {string} bookId - External book identifier (e.g., Google volume ID or UUID).
 * @param {string} title
 * @param {string} author
 * @param {string} published
 * @param {string} isbn
 * @returns {Promise<Object>} Inserted book row.
 */
export async function addBook(bookId, title, author, published, isbn) {
    return withTransaction(async (client) => {
        const result = await client.query(
            'INSERT INTO books (book_id, title, author, published, isbn) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [bookId, title, author, published, isbn]
        );
        return result.rows[0];
    });
}

/**
 * Get book metadata for a given book id.
 * @param {string} bookId
 * @returns {Promise<{title:string,author:string,published:string,isbn:string}|null>}
 */
export async function getBookInfo(bookId) {
    return withTransaction(async (client) => {
        const result = await client.query(
            'SELECT title, author, published, isbn FROM books WHERE book_id = $1',
            [bookId]
        );
        return result.rows[0] || null;
    });
}

/**
 * Find books by title.
 * @param {string} title
 * @returns {Promise<Array<Object>>}
 */
export async function getByTitle(title) {
    return withTransaction(async (client) => {
        const result = await client.query(
            'SELECT title, author, published, isbn FROM books WHERE title = $1',
            [title]
        );
        return result.rows;
    });
}

/**
 * Find books by author.
 * @param {string} author
 * @returns {Promise<Array<Object>>}
 */
export async function getByAuthor(author) {
    return withTransaction(async (client) => {
        const result = await client.query(
            'SELECT title, author, published, isbn FROM books WHERE author = $1',
            [author]
        );
        return result.rows;
    });
}

/**
 * Find books by ISBN.
 * @param {string} isbn
 * @returns {Promise<Array<Object>>}
 */
export async function getIsbn(isbn) {
    return withTransaction(async (client) => {
        const result = await client.query(
            'SELECT title, author, published, isbn FROM books WHERE isbn = $1',
            [isbn]
        );
        return result.rows;
    });
}
