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

**Gemini API Key Generation**:

Prerequisites:
- A [Google AI Studio](https://aistudio.google.com) Account.

Step 1: Access Google AI Studio
1. Go to [Google AI Studio](https://aistudio.google.com).
2. Sign in with your Google account.
3. Click on the "Get API key" button in the top-left sidebar.

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

