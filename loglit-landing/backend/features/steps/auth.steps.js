const { Given, When, Then } = require('@cucumber/cucumber');
const request = require('supertest');
const assert = require('assert');
const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env') });

// We'll dynamically require the app once implemented
let app;
try {
  app = require('../../app');
} catch (e) {
  // Placeholder stub to make initial failing tests explicit
  app = null;
}

const { pool } = require('../../db');
const jwt = require('jsonwebtoken');

let registrationResponse;
let loginResponse;
let protectedResponse;
let token;

async function resetDb() {
  // Simple cleanup for users and books tables between scenarios
  await pool.query('DELETE FROM books');
  await pool.query('DELETE FROM users');
}

Given('a clean user database', async function() {
  await resetDb();
});

Given('an existing user with username {string} email {string} and password {string}', async function(username, email, password) {
  await resetDb();
  // Register user through API if available, else insert directly
  if (app) {
    await request(app).post('/api/auth/register').send({ username, email, password });
  } else {
    // Direct DB insert with bcrypt once implementation exists; currently force fail
    throw new Error('App not implemented yet');
  }
});

When('I register with username {string} email {string} and password {string}', async function(username, email, password) {
  assert(app, 'App not implemented yet');
  registrationResponse = await request(app).post('/api/auth/register').send({ username, email, password });
});

Then('the registration response status should be {int}', function(status) {
  assert.strictEqual(registrationResponse.status, status);
});

Then('the registration response should include a numeric user id', function() {
  assert.ok(registrationResponse.body.id, 'id missing');
  assert.strictEqual(typeof registrationResponse.body.id, 'number');
});

When('I login with email {string} and password {string}', async function(email, password) {
  assert(app, 'App not implemented yet');
  loginResponse = await request(app).post('/api/auth/login').send({ email, password });
});

Then('the login response status should be {int}', function(status) {
  assert.strictEqual(loginResponse.status, status);
});

Then('the login response should include a valid JWT token', function() {
  token = loginResponse.body.token;
  assert.ok(token, 'token missing');
  const decoded = jwt.decode(token);
  assert.ok(decoded, 'token not decodable');
});

Given('I have a JWT for email {string} and password {string}', async function(email, password) {
  assert(app, 'App not implemented yet');
  loginResponse = await request(app).post('/api/auth/login').send({ email, password });
  token = loginResponse.body.token;
  assert.ok(token, 'token missing');
});

When('I request the protected resource with the token', async function() {
  assert(app, 'App not implemented yet');
  protectedResponse = await request(app).get('/api/protected').set('Authorization', `Bearer ${token}`);
});

When('I request the protected resource with an invalid token', async function() {
  assert(app, 'App not implemented yet');
  protectedResponse = await request(app).get('/api/protected').set('Authorization', 'Bearer invalid.token.here');
});

Then('the protected response status should be {int}', function(status) {
  assert.strictEqual(protectedResponse.status, status);
});

Then('the protected response should include the username {string}', function(username) {
  assert.strictEqual(protectedResponse.body.username, username);
});
