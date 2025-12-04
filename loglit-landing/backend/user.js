import { withTransaction } from './db.js';
import bcrypt from 'bcrypt';

// Small validation helpers to express intent and avoid repetition
function requireParameter(value, name) {
    if (value === undefined || value === null) {
        const err = new Error(`${name} is required`);
        err.param = name;
        throw err;
    }
}

function requireNonEmptyString(value, name) {
    requireParameter(value, name);
    if (typeof value !== 'string' || value.trim() === '') {
        const err = new Error(`${name} must be a non-empty string`);
        err.param = name;
        throw err;
    }
}

/**
 * Create a new user with a hashed password.
 * @param {string} username - Desired username (unique).
 * @param {string} email - User email (unique).
 * @param {string} password - Plain-text password (will be hashed).
 * @returns {Promise<{username:string, date_joined:Date}>} Inserted user info.
 * @throws {Error} If required parameters are missing or uniqueness violations occur.
 */
export async function newUser(username, email, password) {
    return withTransaction(async (client) => {
        // Basic validation
        requireNonEmptyString(username, 'username');
        requireNonEmptyString(email, 'email');
        requireNonEmptyString(password, 'password');

        // Hash the password before inserting
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        try {
            // Insert user (let database constraints handle uniqueness)
            const result = await client.query(
                `INSERT INTO users (username, email, password_hash)
                 VALUES ($1, $2, $3)
                 RETURNING username, date_joined`,
                [username, email, passwordHash]
            );

            return result.rows[0];

        } catch (error) {
            // Handle unique constraint violations (Postgres error code 23505)
            if (error && error.code === '23505' && error.detail) {
                if (error.detail.includes('username')) {
                    throw new Error('Username already exists');
                }
                if (error.detail.includes('email')) {
                    throw new Error('Email already exists');
                }
            }
            throw error;
        }
    });
}

/**
 * Update a user's username.
 * @param {string} username - Current username.
 * @param {string} newUsername - New desired username.
 * @returns {Promise<{username:string}>} Updated user row.
 */
export async function updateUsername(username, newUsername) {
    return withTransaction(async (client) => {
        requireNonEmptyString(newUsername, 'newUsername');
        requireNonEmptyString(username, 'username');

        const trimmedNewUsername = newUsername.trim();

        // Check if new username already exists
        const existingUser = await client.query(
            'SELECT username FROM users WHERE username = $1',
            [trimmedNewUsername]
        );
        if (existingUser.rows.length > 0 && existingUser.rows[0].username !== username) {
            throw new Error('Username already exists');
        }

        try {
            // Update the users table - ON UPDATE CASCADE ensures related rows update
            const result = await client.query(
                `UPDATE users
                 SET username = $2
                 WHERE username = $1
                 RETURNING username`,
                [username, trimmedNewUsername]
            );

            if (result.rowCount === 0) {
                throw new Error('User not found');
            }

            return result.rows[0];
        } catch (error) {
            if (error && error.code === '23505' && error.detail && error.detail.includes('username')) {
                throw new Error('Username already exists');
            }
            throw error;
        }
    });
}

/**
 * Update a user's profile description.
 * @param {string} username - Username to update.
 * @param {string|null} description - New description text (may be null).
 * @returns {Promise<{username:string, description:string|null}>}
 */
export async function updateDescription(username, description) {
    return withTransaction(async (client) => {
        requireNonEmptyString(username, 'username');

        const result = await client.query(
            `UPDATE users
             SET description = $2
             WHERE username = $1
             RETURNING username, description`,
            [username, description]
        );
        if (result.rowCount === 0) {
            const err = new Error('User not found');
            err.status = 404;
            throw err;
        }
        return result.rows[0];
    });
}

/**
 * Delete a user by username.
 * @param {string} username - Username to delete.
 * @returns {Promise<{username:string, deleted:boolean}>}
 */
export async function deleteUser(username) {
    return withTransaction(async (client) => {
        requireNonEmptyString(username, 'username');
        const result = await client.query('DELETE FROM users WHERE username = $1', [username]);

        if (result.rowCount === 0) {
            throw new Error('User not found');
        }
        return { username, deleted: true };
    });
}

/**
 * Fetch public details for a user.
 * @param {string} username - Username to fetch.
 * @returns {Promise<Object|null>} User row or null if not found.
 */
export async function getUserDetails (username) {
    return withTransaction(async (client) => {
        requireNonEmptyString(username, 'username');
        const result = await client.query(
            'SELECT username, email, date_joined, description FROM users WHERE username = $1',
            [username]
        );
        return result.rows[0] || null;
    });
}

/**
 * Add a friendship (user follows friend).
 * @param {string} userUsername - The follower's username.
 * @param {string} friendUsername - The followed user's username.
 * @returns {Promise<Object>} Inserted friendship row.
 */
export async function addFriend(userUsername, friendUsername) {
    return withTransaction(async (client) => {
        requireNonEmptyString(userUsername, 'userUsername');
        requireNonEmptyString(friendUsername, 'friendUsername');

        if (userUsername === friendUsername) {
            throw new Error('Cannot add yourself as a friend');
        }

        // Ensure the friend exists
        const friendExists = await client.query('SELECT username FROM users WHERE username = $1', [friendUsername]);
        if (friendExists.rowCount === 0) {
            const err = new Error('Friend user not found');
            err.status = 404;
            throw err;
        }

        // Check if relationship already exists
        const existing = await client.query(
            'SELECT 1 FROM user_friends WHERE user_username = $1 AND friend_username = $2',
            [userUsername, friendUsername]
        );
        if (existing.rowCount > 0) {
            const err = new Error('Already following this user');
            // Mark with unique-violation like code so callers that check `err.code === '23505'` behave the same
            err.code = '23505';
            throw err;
        }

        const result = await client.query(
            'INSERT INTO user_friends (user_username, friend_username) VALUES ($1, $2) RETURNING *',
            [userUsername, friendUsername]
        );
        return result.rows[0];
    });
}

/**
 * Remove a friendship.
 * @param {string} userUsername - The follower's username.
 * @param {string} friendUsername - The followed user's username.
 * @returns {Promise<{friend:string, deleted:boolean}>}
 */
export async function removeFriend(userUsername, friendUsername) {
    return withTransaction(async (client) => {
        requireNonEmptyString(userUsername, 'userUsername');
        requireNonEmptyString(friendUsername, 'friendUsername');

        const result = await client.query(
            'DELETE FROM user_friends WHERE user_username = $1 AND friend_username = $2',
            [userUsername, friendUsername]
        );
        if (result.rowCount === 0) {
            throw new Error('Friend not found');
        }
        
        return { friend: friendUsername, deleted: true };
    });
}

/**
 * Get all followers (users who follow the given username).
 * @param {string} username - Username to query followers for.
 * @returns {Promise<Array<{user_username:string}>>}
 */
export async function getFollowers(username) {
    return withTransaction(async (client) => {
        requireNonEmptyString(username, 'username');
        
        const result = await client.query(
            'SELECT user_username FROM user_friends WHERE friend_username = $1',
            [username]
        );
        
        return result.rows;
    });
}

/**
 * Get all users that the given username is following.
 * @param {string} username - Username to query following list for.
 * @returns {Promise<Array<{friend_username:string}>>}
 */
export async function getFollowing(username) {
    return withTransaction(async (client) => {
        requireNonEmptyString(username, 'username');
        
        const result = await client.query(
            'SELECT friend_username FROM user_friends WHERE user_username = $1',
            [username]
        );
        
        return result.rows;
    });
}