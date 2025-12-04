import test from 'node:test';
import assert from 'assert';
import * as db from '../db.js';


test('getUserByEmail returns null when not found', async () => {
  const orig = db.pool.query;
  db.pool.query = async () => ({ rows: [] });
  try {
    const user = await db.getUserByEmail('noone@example.com');
    assert.strictEqual(user, null);
  } finally {
    db.pool.query = orig;
  }
});

test('getUserByEmail returns user when present', async () => {
  const orig = db.pool.query;
  db.pool.query = async () => ({ rows: [{ username: 'tester', email: 't@example.com', password_hash: 'hash' }] });
  try {
    const user = await db.getUserByEmail('t@example.com');
    assert.ok(user);
    assert.strictEqual(user.username, 'tester');
    assert.strictEqual(user.email, 't@example.com');
  } finally {
    db.pool.query = orig;
  }
});

test('newUser inserts when no existing user', async () => {
  const orig = db.pool.query;
  db.pool.query = async (text, params) => {
    if (/SELECT\s+username/i.test(text)) {
      return { rows: [] };
    }
    if (/INSERT\s+INTO\s+users/i.test(text)) {
      return { rows: [{ username: params[0], email: params[1] }] };
    }
    return { rows: [] };
  };

  try {
    const result = await db.newUser('newuser', 'new@example.com', 'pw-hash');
    assert.strictEqual(result.username, 'newuser');
    assert.strictEqual(result.email, 'new@example.com');
  } finally {
    db.pool.query = orig;
  }
});

test('newUser throws when username exists', async () => {
  const orig = db.pool.query;
  db.pool.query = async (text) => {
    if (/SELECT\s+username/i.test(text)) {
      return { rows: [{ username: 'exists', email: 'e@example.com' }] };
    }
    return { rows: [] };
  };

  try {
    let threw = false;
    try {
      await db.newUser('exists', 'e@example.com', 'pw-hash');
    } catch (err) {
      threw = true;
      assert.ok(/exists/i.test(err.message));
    }
    assert.ok(threw, 'newUser did not throw on existing user');
  } finally {
    db.pool.query = orig;
  }
});
