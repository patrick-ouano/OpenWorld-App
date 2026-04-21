# OpenWorld-App

**For CEN3031 grading, we provided the .env variables in the project documentation.**
## Prerequisites

- **Node.js** — use a current **LTS** release (e.g. 20.x or 22.x). Check with `node -v`.
- **npm** — bundled with Node (`npm -v`).
- **MongoDB** — a cluster or local instance reachable via `MONGO_URI` in `server/.env`. If `MONGO_URI` is omitted, the server falls back to `mongodb://localhost:27017/openworld`.

There is no root `package.json`; install and run scripts separately in `server` and `client`.

## Clone the repository

```bash
git clone <repository-url>
cd OpenWorld-App
```

## Backend (`server`)

1. Copy environment template to a local file (make sure to not commit them!):

   - From the repo root: copy `server/.env.example` to `server/.env`.
   - Set **`MONGO_URI`**, **`JWT_SECRET`**, and **`PORT`** (API port; `5000` is typical).

2. Install and start the API:

   ```bash
   cd server
   npm install
   npm run dev
   ```

   `npm run dev` uses Node’s watch mode (`node --watch server.js`). Use `npm start` for a plain `node server.js` run.

Keep this process running while you work on the app.

## Frontend (`client`)

In a **second** terminal:

```bash
cd client
npm install
npm run dev
```

Vite serves the UI and proxies `/api` to the backend. The dev server reads **`PORT` from `server/.env`** (not from shell env) to match the API URL, so create `server/.env` before relying on the proxy and restart Vite if you change `PORT`.