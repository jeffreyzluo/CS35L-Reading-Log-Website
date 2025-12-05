
# Reading Log — Local Development

This file contains detailed instructions for running the Reading Log app locally (backend + frontend).

## Prerequisites

- Node.js (v16+ recommended)
- npm
- PostgreSQL@18

## Setup summary

Installing PSQL
1. Download and install PostgreSQL: https://www.postgresql.org/download/
2. During installation, make sure to set a password for the postgres superuser.

Creating database in PSQL
1. Open a terminal, and run the following command: psql -U postgres -W
2. If PATH isn't set, run the following command instead: "C:\Program Files\PostgreSQL\15\bin\psql.exe" -U postgres -d postgres -W 
3. Enter your password, to access psql terminal
4. Run the following command to create a readinglog database: 'CREATE DATABASE readinglog;'
5. Connect to the readinglog database: '\c readinglog'
6. Run the following commands:

CREATE TABLE users (
    username      VARCHAR(50) PRIMARY KEY,
    email         VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    date_joined   TIMESTAMP NOT NULL DEFAULT NOW(),
    description   TEXT
);

CREATE TABLE user_books (
    username    VARCHAR(50) REFERENCES users(username) ON DELETE CASCADE,   
    book_id     TEXT,
    rating      INT,
    review      TEXT,
    status      TEXT,
    added_at    TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (username, book_id)
);

CREATE TABLE user_friends (
    user_username    VARCHAR(50) REFERENCES users(username) ON DELETE CASCADE ON UPDATE CASCADE,
    friend_username  VARCHAR(50) REFERENCES users(username) ON DELETE CASCADE ON UPDATE CASCADE,
    PRIMARY KEY (user_username, friend_username)
);

7. Run the following command to verify tables have been created: \d
8. Update .env file with the following information:
PGHOST=localhost
PGUSER=postgres
PGPASSWORD=YOUR_PASSWORD
PGDATABASE=readinglog
PGPORT=5432
DATABASE_URL=postgresql://postgres:{PGPASSWORD}@localhost:5432/readinglog
DB_SSL=false

IMPORTANT NOTE(S):
1. Remember to replace PGPASSWORD with your actual password, and update DATABASE_URL
2. DATABASE_URL follows this format: postgresql://{PGUSER}:{PGPASSWORD}@{PGHOST}:{PGPORT}/{PGDATABASE}

##Running the App

After setting up the postgreSQL database, follow the instructions below:
1. Install dependencies: `npm install`
2. Add a `.env` file in the repo root with database and secret settings
3. Run backend: `npm run backend`
4. Run frontend: `npm start`



## How to test friends feature
1. After experimenting with the app, if you want to experiment with friends, you should login on two different chrome profiles.
2. After friending each other, you should be able to see the other account's profile.


## API Key Generation

**Gemini API Key Generation**:

Prerequisites:
- A [Google AI Studio](https://aistudio.google.com) Account that isn't restricted by your professional organization.

Step 1: Access Google AI Studio
1. Go to [Google AI Studio](https://aistudio.google.com).
2. Sign in with your Google account.
3. Click on the "Get API key" button in the bottom-left sidebar.

Step 2: Create the Key
1. Click on the "Create API key" button in the top right.
2. Name your key and attach to desired cloud project.

Step 3: Securing Your Key

Once the key is generated, it will appear in a list.
1. Click the Copy icon next to your key.
2. Paste onto .env with GEMINI_API_KEY=key.


**Google Books API Key Generation**:

1. Go to [Google Cloud Console](https://console.cloud.google.com).
2. Log in with a google account.
3. Select a Project from the top left corner.
4. New Project -> Create .
5. Open Project Picker -> Open new project.
6. APIs & Services -> Library -> Look up "Books API" -> "Enable".
7. Credentials -> + Create Credentials -> API Key.
8. Go to -> Edit API Key -> Restrict key -> Books API -> Save.
9. Show key -> Paste onto .env with GOOGLE_BOOKS_API_KEY=key.



**Google Authorization API Key Generation**:

Prerequisites:
- A Google Cloud Platform (GCP) Account.
- An existing Project within GCP.

Step 1: Configure the OAuth Consent Screen
Before you can create credentials, you must configure the consent screen (the screen users see when they log in).
1. Navigate to the [Google Cloud Console](https://console.cloud.google.com).
2. In the left sidebar, go to APIs & Services > OAuth consent screen.
3. Click the "Get started" button to configure application settings.
4. Fill out Application Name with "LogLit", fill out Contact Email, select External, agree to Terms and Services and create the OAuth configuration.

Step 2: Create OAuth Client
1. In the left sidebar, go to Overview.
2. Click the "Create OAuth client" button
3. Fill out Application Type with "Web application", fill out Name, add http://localhost:3000 as an Authorized JavaScript origins, and create the OAuth client.
4. The Client ID shown will be the GOOGLE_CLIENT_ID and REACT_APP_GOOGLE_CLIENT_ID API keys inside .env.

What .env file should have:
```bash
PGHOST=localhost
PGUSER=postgres
PGPASSWORD=postgres
PGDATABASE=readinglog
PGPORT=5432
JWT_SECRET=12345

DATABASE_URL=postgresql://postgres:postgres@localhost:5432/readinglog
DB_SSL=false
```

## Playwright End-to-End Tests

Run the Playwright E2E tests for the auth flow (signup, sign out, sign in, delete account) and adding book reviews (adding, deleting).

1. Install Playwright browsers (required once):

```bash
npx playwright install
```

2. Start the backend and frontend in separate terminals:

```bash
# Terminal 1: start backend
npm run backend

# Terminal 2: start frontend (React dev server)
npm start
```

3. Run the E2E tests:

```bash
# Terminal 3: run tests
npm run test:e2e
```

E2E Tests Included
- `tests/e2e/auth.spec.mjs` — Auth end-to-end flow:
	- Signs up a new, unique user through the UI
	- Verifies navigation to `/profile`
	- Signs out and signs back in
	- Deletes the created account and verifies redirect to `/login`

- `tests/e2e/book.spec.mjs` — Book review flow:
	- Signs up a new, unique user through the UI
	- Performs a real Google Books search via the backend (requires `GOOGLE_BOOKS_API_KEY` in your `.env`)
	- Submits a review (rating + text) from the Search results UI
	- Verifies the review appears in the user's `SharedPosts` on their profile
	- Deletes the review and verifies it is removed
	- Cleans up test account by deleting the user

- `tests/e2e/friends.spec.mjs` — Friends / follow flow:
	- Creates two unique users through the UI (user A and user B)
	- Signs in as user A and adds user B by username using the "Find friend via username" input and "Add Friend" button
	- Verifies user B appears in A's `Following` list
	- Signs in as user B and adds user A back, verifying A appears in B's `Following` list
	- Cleans up both test accounts by deleting each user

How to run specific tests
- Run all E2E tests (default config):

```bash
npm run test:e2e
```

- Run a single test file:

```bash
npm run test:e2e -- tests/e2e/book.spec.mjs
```
or
```bash
npm run test:e2e -- tests/e2e/auth.spec.mjs
```
or
```bash
npm run test:e2e -- tests/e2e/friends.spec.mjs
```

Debugging & Slower Visual Runs
- Run headed (shows browser) and slow actions using `SLOWMO` and `--headed`:

```bash
SLOWMO=80 npm run test:e2e -- --headed
```

- Run interactive Playwright inspector (pauses at breakpoints):

```bash
npm run test:e2e -- --debug
```

 - The book test performs a real `/api/search` call to the backend, which in turn calls Google Books. Ensure `GOOGLE_BOOKS_API_KEY` is set in your `.env` and the backend is started before running this test.


 ## Database Testing

 Run the tests in backend/tests to test database operations while using transaction rollbacks to ensure no changes to the actual database.

1. Run testTransactionUser.test.js
2. Run testTransactionBook.test.js



## Sequence Diagrams

- **Note:** The following diagrams use UML sequence diagram notation.
- **Images:** `public/LoginSequenceDiagram.drawio.png` and `public/LogLitProfileSequenceDiagram.drawio.png`

### Login Sequence

![Login Sequence Diagram](public/LoginSequenceDiagram.drawio.png)

### LogLit Profile Sequence

![LogLit Profile Sequence Diagram](public/LogLitProfileSequenceDiagram.drawio.png)
## Entity Relationship Diagram

- **Note:** The ER diagram uses the notation presented in lectures.
- **Image:** `public/EntityRelationshipDiagram.png`

![Entity Relationship Diagram](public/EntityRelationshipDiagram.png)
