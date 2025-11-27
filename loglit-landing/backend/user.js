import { withTransaction } from './db.js';
import { Pool } from './db.js';
import bcrypt from 'bcrypt';

export async function newUser(username, email, password) {
    return withTransaction(async (client) => {
        // 1. Basic validation
        if (!username || !email || !password) {
            throw new Error("Username, email, and password are required");
        }

        // 2. Hash password
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        try {
            // 3. Insert user (let database constraints handle uniqueness)
            const result = await client.query(
                `INSERT INTO users (username, email, password_hash)
                 VALUES ($1, $2, $3)
                 RETURNING username, date_joined`,
                [username, email, passwordHash]
            );

            return result.rows[0];

        } catch (error) {
            // Handle unique constraint violations
            if (error.code === '23505') {
                if (error.detail.includes('username')) {
                    throw new Error("Username already exists");
                }
                if (error.detail.includes('email')) {
                    throw new Error("Email already exists");
                }
            }
            throw error;
        }
    });
}


export async function deleteUser(username) {
    return withTransaction(async (client) => {
        if (!username) {
            throw new Error("Username is required");
        }
        const result = await client.query('DELETE FROM users WHERE username = $1', [username]);

        if (result.rowCount === 0) {
            throw new Error("User not found");
        }
        return { username, deleted: true };
    });
}

export async function getUserDetails (username) {
    return withTransaction(async (client) => {
        if (!username) {
            throw new Error("Username is required");
        }
        const result = await client.query(
            'SELECT username, email, date_joined FROM users WHERE username = $1',
            [username]
        )
        return result.rows;
    });
}

export async function addFriend(user, friend) {
    return withTransaction(async (client) => {
        const result = await client.query(
            'INSERT INTO user_friends (user_username, friend_username) VALUES ($1, $2)',
            [user, friend]
        );
        return result.rows[0];
    });
}

export async function removeFriend(user, friend) {
    return withTransaction(async (client) => {
        const result = await client.query(
            'DELETE FROM user_friends WHERE user_username = $1 AND friend_username = $2',
            [user, friend]
        );
        if (result.rowCount === 0) {
            throw new Error("Friend not found");
        }
        
        return { friend, deleted: true };
    });
}

export async function getFollowers(username) {
    return withTransaction(async (client) => {
        if (!username) {
            throw new Error("Username is required");
        }
        
        const result = await client.query(
            'SELECT user_username FROM user_friends WHERE friend_username = $1',
            [username]
        );
        
        return result.rows;
    });
}

export async function getFollowing(username) {
    return withTransaction(async (client) => {
        if (!username) {
            throw new Error("Username is required");
        }
        
        const result = await client.query(
            'SELECT friend_username FROM user_friends WHERE user_username = $1',
            [username]
        );
        
        return result.rows;
    });
}

