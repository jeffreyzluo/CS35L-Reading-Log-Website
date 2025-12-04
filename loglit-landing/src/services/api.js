// Small API service layer for frontend
// - Centralizes fetch logic and error handling
// - Provides named functions for backend endpoints (auth, users, books, search, friends)
// - Use these helpers from UI components to keep concerns separated

const BASE = process.env.REACT_APP_API_BASE || '';

async function fetchJSON(path, options = {}) {
  const res = await fetch(BASE + path, options);
  const contentType = res.headers.get('content-type') || '';
  let body = null;
  if (contentType.includes('application/json')) {
    body = await res.json().catch(() => null);
  } else {
    body = await res.text().catch(() => null);
  }

  if (!res.ok) {
    const errMsg = (body && (body.error || body.message)) || res.statusText || 'Request failed';
    const err = new Error(errMsg);
    err.status = res.status;
    err.body = body;
    throw err;
  }

  return body;
}

// Auth endpoints
const auth = {
  login: (email, password) => fetchJSON('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password })
  }),

  register: (username, email, password) => fetchJSON('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ username, email, password })
  }),

  google: (idToken) => fetchJSON('/api/auth/google', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ id_token: idToken })
  }),
};

// Users-related endpoints
const users = {
  getMe: () => fetchJSON('/api/me', { credentials: 'include' }),
  getUser: (username) => fetchJSON(`/api/users/${encodeURIComponent(username)}`, { credentials: 'include' }),
  getUserBooks: (username) => fetchJSON(`/api/user_books/${encodeURIComponent(username)}`, { credentials: 'include' }),
  updateDescription: (description) => fetchJSON('/api/user/description', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ description })
  }),
  updateUsername: (newUsername) => fetchJSON('/api/user/username', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ newUsername })
  }),
  getFollowers: (username) => fetchJSON(`/api/user/${encodeURIComponent(username)}/followers`, { credentials: 'include' }),
  getFollowing: (username) => fetchJSON(`/api/user/${encodeURIComponent(username)}/following`, { credentials: 'include' }),
  addFriend: (friendUsername) => fetchJSON('/api/user/friends', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ friendUsername })
  }),
};

// Books / posts
const books = {
  addBook: (payload) => fetchJSON('/api/books/add', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload)
  }),
  deleteBook: (bookId) => fetchJSON(`/api/books/${encodeURIComponent(bookId)}`, {
    method: 'DELETE',
    credentials: 'include'
  })
};

// Search
const search = {
  // Backend search endpoint (books)
  searchBooks: (q) => fetchJSON(`/api/search?q=${encodeURIComponent(q)}`),
  // Autocomplete for users
  searchUsers: (q) => fetchJSON(`/api/users/search?q=${encodeURIComponent(q)}`, { credentials: 'include' })
};

// Recommendation
const recommendation = {
  getRecommendation: (titles) => fetchJSON('/api/recommendation', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ titles })
  })
};

const api = {
  fetchJSON,
  auth,
  users,
  books,
  search,
  recommendation,
};

export default api;
