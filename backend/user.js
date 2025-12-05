import { withTransaction } from './db.js';
import {user_queries} from './queries.js';
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

//Note: For all functions below, we have a transaction wrapper for ACID management and testing purposes.
//withTransaction wrapper will be used as default, and withTestTransaction can be passed in for testing database oeprations.

/**
 * Create a new user with a hashed password.
 * @param {string} username - Desired username (unique).
 * @param {string} email - User email (unique).
 * @param {string} password - Plain-text password (will be hashed).
 * @returns {Promise<{username:string, date_joined:Date}>} Inserted user info.
 * @throws {Error} If required parameters are missing or uniqueness violations occur.
 */
export async function newUser(username, email, password, tx = withTransaction) {
    return tx(async (client) => {
        // Basic validation
        requireNonEmptyString(username, 'username');
        requireNonEmptyString(email, 'email');
        requireNonEmptyString(password, 'password');

        // Hash the password before inserting
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);
        
        const emailCheck = await client.query(
            user_queries.emailExists,
            [email]
        );
        if (emailCheck.rowCount !== 0) {
            throw new Error('Email already exists');
        }

        try {
            // Insert user (let database constraints handle uniqueness)
            const result = await client.query(
                user_queries.newUser,
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
export async function updateUsername(username, newUsername, tx = withTransaction) {
    return tx(async (client) => {
        requireNonEmptyString(newUsername, 'newUsername');
        requireNonEmptyString(username, 'username');

        const trimmedNewUsername = newUsername.trim();

        // Check if new username already exists
        const existingUser = await client.query(
            user_queries.userExists,
            [trimmedNewUsername]
        );
        if (existingUser.rows.length > 0 && existingUser.rows[0].username !== username) {
            throw new Error('Username already exists');
        }

        try {
            // Update the users table - ON UPDATE CASCADE ensures related rows update
            const result = await client.query(
                user_queries.updateUsername,
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
export async function updateDescription(username, description, tx = withTransaction) {
    return tx(async (client) => {
        requireNonEmptyString(username, 'username');

        const result = await client.query(
            user_queries.updateDescription,
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
export async function deleteUser(username, tx = withTransaction) {
    return tx(async (client) => {
        requireNonEmptyString(username, 'username');
        const result = await client.query(user_queries.deleteUser, [username]);

        return { username, deleted: result.rowCount > 0 };
    });
}

/**
 * Fetch public details for a user.
 * @param {string} username - Username to fetch.
 * @returns {Promise<Object|null>} User row or null if not found.
 */
export async function getUserDetails (username, tx = withTransaction) {
    return tx(async (client) => {
        requireNonEmptyString(username, 'username');
        const result = await client.query(
            user_queries.getUserDetails,
            [username]
        );
        return result.rows[0] || null;
    });
}

/**
 * Add a friendship (user follows friend).
 * @param {string} usergetUserUsername - The follower's username.
 * @param {string} friendUsername - The followed user's username.
 * @returns {Promise<Object>} Inserted friendship row.
 */
export async function addFriend(userUsername, friendUsername, tx = withTransaction) {
    return tx(async (client) => {
        requireNonEmptyString(userUsername, 'userUsername');
        requireNonEmptyString(friendUsername, 'friendUsername');

        if (userUsername === friendUsername) {
            throw new Error('Cannot add yourself as a friend');
        }

        // Ensure the friend exists
        const friendExists = await client.query(user_queries.friendExists, [friendUsername]);
        if (friendExists.rowCount === 0) {
            const err = new Error('Friend user not found');
            err.status = 404;
            throw err;
        }

        // Check if relationship already exists
        const existing = await client.query(
            user_queries.checkFriendship,
            [userUsername, friendUsername]
        );
        if (existing.rowCount > 0) {
            const err = new Error('Already following this user');
            // Mark with unique-violation like code so callers that check `err.code === '23505'` behave the same
            err.code = '23505';
            throw err;
        }

        const result = await client.query(
            user_queries.addFriend,
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
export async function removeFriend(userUsername, friendUsername, tx = withTransaction) {
    return tx(async (client) => {
        requireNonEmptyString(userUsername, 'userUsername');
        requireNonEmptyString(friendUsername, 'friendUsername');

        const result = await client.query(
            user_queries.removeFriend,
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
export async function getFollowers(username, tx = withTransaction) {
    return tx(async (client) => {
        requireNonEmptyString(username, 'username');
        
        const result = await client.query(
            user_queries.getFollowers,
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
export async function getFollowing(username, tx = withTransaction) {
    return tx(async (client) => {
        requireNonEmptyString(username, 'username');
        
        const result = await client.query(
            user_queries.getFollowing,
            [username]
        );
        
        return result.rows;
    });
}