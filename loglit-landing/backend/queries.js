export const user_queries = {
    newUser: //Parameters: username, email, passwordHash
    `INSERT INTO users (username, email, password_hash)
    VALUES ($1, $2, $3)
    RETURNING username, date_joined
    `,
    userExists: //Parameter: username
    `SELECT username
    FROM users
    WHERE username = $1`,
    emailExists:
    `SELECT *
    FROM users
    WHERE email = $1`,
    
    deleteUser: //Parameters: username
    `DELETE FROM users
    WHERE username = $1`,

    getUserDetails: //Parameter: username
    `SELECT username, email, date_joined, description
    FROM users
    WHERE username = $1`,

    updateUsername: //Parameter: username, newUsername
    `UPDATE users
    SET username = $2
    WHERE username = $1
    RETURNING username
    `,
    
    updateDescription: //Parameters: username, description
    `UPDATE users
    SET description = $2
    WHERE username = $1
    RETURNING username, description`,
    
    
    friendExists: //Parameter: username
    `SELECT username
    FROM users
    WHERE username = $1`,
    
    checkFriendship: //Parameters: user_username, friend_username
    `SELECT 1
    FROM user_friends
    WHERE user_username = $1 AND friend_username = $2`,
    
    addFriend: //Parameters: username, friend_username
    `INSERT INTO user_friends (user_username, friend_username)
    VALUES ($1, $2) RETURNING *`,
    
    removeFriend: //Parameters: username, friend_username
    `DELETE FROM user_friends
    WHERE user_username = $1 AND friend_username = $2`,
    
    getFollowers: //Parameter: friend_username
    `SELECT user_username FROM user_friends WHERE friend_username = $1`,
    
    getFollowing: //Parameter: user_username
    `SELECT friend_username FROM user_friends WHERE user_username = $1`,
}

export const book_queries = {
    addUserBook: //Parameters: username, bookId, rating, review, status, added_at
    `INSERT INTO user_books
    (username, book_id, rating, review, status, added_at)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *`,

    deleteUserBook: //Parameters: username, bookId
    `DELETE FROM user_books
     WHERE username = $1 AND book_id = $2
    `,

    editUserBook: //Parameters: username, bookId, rating, review, status
    `
    UPDATE user_books
    SET rating = $3,
        review = $4,
            status = $5
    WHERE username = $1 AND book_id = $2
    RETURNING *
    
    `,
    retrieveBook: //Parameter: username
    `SELECT book_id, rating, review, status, added_at
    FROM user_books
    WHERE username = $1
    `
}