# app-ide

Next.js front-end for the LLM / test IDE workflow. It talks to a separate backend API; you point the app at that API with environment variables.

## Prerequisites

- [Node.js](https://nodejs.org/) **20.x or newer** (LTS recommended)
- npm (bundled with Node), or another compatible package manager
- A running backend that matches this app’s API (default assumption: `http://localhost:8000`)

## First-time setup

1. **Clone the repository** (or copy the project folder).

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` and set at least **`NEXT_PUBLIC_API_BASE_URL`** to your backend base URL (see [.env.example](.env.example) for all keys and comments).

   > **Note:** Variables that must be available in the browser are prefixed with `NEXT_PUBLIC_` in Next.js. After changing them, restart the dev server.

4. **Run the development server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) (or the URL printed in the terminal).

## Production build

```bash
npm run build
npm start
```

Set the same environment variables on your host or in your deployment platform (including `NEXT_PUBLIC_API_BASE_URL` for the API origin the browser should call).

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_BASE_URL` | **Yes** | Base URL of the backend API (e.g. `http://localhost:8000/`). A trailing slash is optional; the app normalizes it. The app will not start the API client without this variable. |
| `FIGMA_CLIENT_ID` | If using Figma OAuth | Figma app OAuth client ID |
| `FIGMA_CLIENT_SECRET` | If using Figma OAuth | Figma app OAuth client secret |

## Project scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Development server (hot reload) |
| `npm run build` | Production build |
| `npm start` | Serve the production build |

## Security notes for maintainers

- **Do not commit `.env`.** It is listed in `.gitignore`. Share **`.env.example`** only, with placeholders.
- **`NEXT_PUBLIC_*` values are embedded in client bundles** — never put server-only secrets in those variables.
