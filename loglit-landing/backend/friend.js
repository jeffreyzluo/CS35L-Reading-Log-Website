import { withTransaction } from './db.js';
import {pool } from './db.js';

export async function addFriend(username, friendUsername) {
    return withTransaction(async (client) => {
        const result = await client.query(
            'INSERT INTO friends (username, friendUsername) VALUES ($1, $2)',
            [username, friendUsername]
        );
        return result.rows[0];
    });
}

export async function removeFriend(username, friendUsername) {
    return withTransaction(async (client) => {
        const result = await client.query(
            'DELETE FROM friends WHERE username = $1 AND friendUsername = $2',
            [username, friendUsername]
        );
        return result.rowCount > 0;
    });
}