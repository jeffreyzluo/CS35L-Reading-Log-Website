import { newUser, deleteUser, addFriend, removeFriend, getFollowers, getFollowing } from '../user.js';
import { pool } from '../db.js';

// Simple assertion helper
function assert(condition, message) {
    if (!condition) {
        throw new Error(`❌ Assertion failed: ${message}`);
    }
    console.log(`✅ ${message}`);
}

async function testUserFunctions() {
    const testUsername = `testuser_${Date.now()}`;
    const testEmail = `test_${Date.now()}@example.com`;
    const friendUsername = `friend_${Date.now()}`;
    const friendEmail = `friend_${Date.now()}@example.com`;

    try {
        console.log('\n=== Testing User Creation ===');
        
        // Test 1: Create a new user
        const user = await newUser(testUsername, testEmail, 'password123');
        assert(user.username === testUsername, 'User created with correct username');
        assert(user.date_joined !== undefined, 'User has date_joined field');
        
        // Verify user exists in database
        const userCheck = await pool.query(
            'SELECT * FROM users WHERE username = $1',
            [testUsername]
        );
        assert(userCheck.rows.length === 1, 'User exists in database');
        assert(userCheck.rows[0].email === testEmail, 'Email stored correctly');
        assert(userCheck.rows[0].password_hash !== 'password123', 'Password is hashed');

        console.log('\n=== Testing Duplicate Prevention ===');
        
        // Test 2: Try to create duplicate username
        try {
            await newUser(testUsername, 'different@example.com', 'password123');
            assert(false, 'Should have thrown error for duplicate username');
        } catch (error) {
            assert(error.message === 'Username already exists', 'Duplicate username rejected');
        }

        // Test 3: Try to create duplicate email
        try {
            await newUser('differentuser', testEmail, 'password123');
            assert(false, 'Should have thrown error for duplicate email');
        } catch (error) {
            assert(error.message === 'Email already exists', 'Duplicate email rejected');
        }

        console.log('\n=== Testing Friend System ===');
        
        // Create a friend user for testing
        await newUser(friendUsername, friendEmail, 'password123');
        
        // Test 4: Add friend relationship
        await addFriend(testUsername, friendUsername);
        
        const friendCheck = await pool.query(
            'SELECT * FROM user_friends WHERE user_username = $1 AND friend_username = $2',
            [testUsername, friendUsername]
        );
        assert(friendCheck.rows.length === 1, 'Friend relationship created');

        // Test 5: Get following list
        const following = await getFollowing(testUsername);
        assert(following.length === 1, 'Following list has 1 user');
        assert(following[0].friend_username === friendUsername, 'Following correct user');

        // Test 6: Get followers list
        const followers = await getFollowers(friendUsername);
        assert(followers.length === 1, 'Followers list has 1 user');
        assert(followers[0].user_username === testUsername, 'Correct follower');

        // Test 7: Remove friend relationship
        await removeFriend(testUsername, friendUsername);
        
        const removedCheck = await pool.query(
            'SELECT * FROM user_friends WHERE user_username = $1 AND friend_username = $2',
            [testUsername, friendUsername]
        );
        assert(removedCheck.rows.length === 0, 'Friend relationship removed');

        // Test 8: Verify following list is empty
        const followingAfter = await getFollowing(testUsername);
        assert(followingAfter.length === 0, 'Following list is empty after removal');

        console.log('\n=== Testing User Deletion ===');
        
        // Test 9: Delete user
        const deleteResult = await deleteUser(testUsername);
        assert(deleteResult.deleted === true, 'Delete returns success');
        
        const deletedCheck = await pool.query(
            'SELECT * FROM users WHERE username = $1',
            [testUsername]
        );
        assert(deletedCheck.rows.length === 0, 'User removed from database');

        // Test 10: Try to delete non-existent user
        try {
            await deleteUser('nonexistentuser123456');
            assert(false, 'Should have thrown error for non-existent user');
        } catch (error) {
            assert(error.message === 'User not found', 'Non-existent user deletion rejected');
        }

        // Cleanup friend user
        await deleteUser(friendUsername);

        console.log('\n✅ All tests passed!\n');

    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        console.error(error.stack);
        
        // Cleanup on failure
        try {
            await pool.query('DELETE FROM users WHERE username = $1 OR username = $2', 
                [testUsername, friendUsername]);
        } catch (cleanupError) {
            console.error('Cleanup failed:', cleanupError.message);
        }
        
        process.exit(1);
    } finally {
        await pool.end();
    }
}

// Run tests
console.log('Starting tests against real database...');
testUserFunctions();