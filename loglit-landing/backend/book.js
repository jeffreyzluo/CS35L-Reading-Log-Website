import { withTransaction } from './db.js';
import {pool } from './db.js';


export async function addBook(bookId, title, author, published, isbn) {
    return withTransaction(async (client) => {
        return client.query(
            'INSERT INTO books (book_id, title, author, published, isbn) VALUES ($1, $2, $3, $4, $5)',
            [bookId, title, author, published, isbn]
        );
    });
}

export async function getBookInfo(bookId) {
    return withTransaction(async (client) => {
        return client.query(
            'SELECT title, author, published, isbn FROM  books WHERE book_id = $1',
            [bookId]
        );
    });
}

export async function getByTitle(title) {
    return withTransaction(async (client) => {
        return client.query(
            'SELECT title, author, published, isbn FROM books WHERE title = $1',
            [title]
        );
    });
}

export async function getByAuthor(author) {
    return withTransaction(async (client) => {
        return client.query(
            'SELECT title, author, published, isbn FROM books WHERE author = $1',
            [author]
        );
    });
}

export async function getIsbn(isbn) {
    return withTransaction(async (client) => {
        return client.query(
            'SELECT title, author, published, isbn FROM books WHERE isbn = $1',
            [isbn]
        );
    });
}
