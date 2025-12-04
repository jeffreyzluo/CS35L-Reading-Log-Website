# Reading Log — Local Development

This file contains detailed instructions for running the Reading Log app locally (backend + frontend).

## Prerequisites

- Node.js (v16+ recommended)
- npm
- PostgreSQL@18

## Setup summary

1. Install deps: `npm install`
2. Create a Postgres DB and run `backend/databases.txt` schema
3. Add a `.env` file in the repo root with database and secret settings
4. Run backend: `npm run backend`
5. Run frontend: `npm start`

## API Key Generation

Gemini API Key Generation:

Google Books API Key Generation:
1. Go to Google Cloud Console
2. Log in with a google account
3. Select a Project from the top left corner
4. New Project -> Create 
5. Open Project Picker -> Open new project
6. APIs & Services -> Library -> Look up "Books API" -> "Enable"
7. Credentials -> + Create Credentials -> API Key
8. Go to -> Edit API Key -> Restrict key -> Books API -> Save
9. Show key -> Paste onto .env with GOOGLE_BOOKS_API_KEY=key



Google authorization API Key Generation:
