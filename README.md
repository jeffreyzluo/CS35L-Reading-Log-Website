# CS35L-Reading-Log-Website

Quick start

This repository contains the main website in the `loglit-landing` folder. To run the project locally and see the main README.md:

1. Enter the main website folder:

```bash
cd loglit-landing
```

2. Install dependencies:

```bash
npm install
```

3. Run the frontend (in one terminal):

```bash
npm start
```

4. Run the backend (in another terminal from the same `loglit-landing` folder):

```bash
npm run backend
```

Notes
- The frontend is configured to proxy API calls to `http://localhost:3001` (see `package.json`).
- The website requires a .env file with API keys to run properly
- If you prefer to run both frontend and backend together, use a terminal multiplexer (tmux) or run in two separate terminal windows/tabs.
