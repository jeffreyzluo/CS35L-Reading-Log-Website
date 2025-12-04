// Deprecated shim: canonical friend/user-friend helpers live in `user.js`.
// This module re-exports the functions from `user.js` so existing imports
// continue to work while avoiding duplicate implementations.
import { addFriend as addFriendFromUser, removeFriend as removeFriendFromUser } from './user.js';

/**
 * Deprecated: addFriend is forwarded to `user.addFriend`.
 * Kept for compatibility with earlier imports.
 */
export async function addFriend(username, friendUsername) {
    return addFriendFromUser(username, friendUsername);
}

/**
 * Deprecated: removeFriend is forwarded to `user.removeFriend`.
 */
export async function removeFriend(username, friendUsername) {
    return removeFriendFromUser(username, friendUsername);
}