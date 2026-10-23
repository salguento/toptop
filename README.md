# Nuxt Minimal Starter

Look at the [Nuxt documentation](https://nuxt.com/docs/getting-started/introduction) to learn more.

## Setup

Use Node.js 22 before installing dependencies:

```bash
nvm use
```

Make sure to install dependencies:

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

Configure the runtime environment:

```bash
NUXT_PUBLIC_API_BASE=https://ws.audioscrobbler.com/2.0/?
NUXT_PUBLIC_API_KEY=your_lastfm_api_key
NUXT_DISCOGS_KEY=your_discogs_consumer_key
NUXT_DISCOGS_SECRET=your_discogs_consumer_secret
```

The Discogs credentials are server-only. Do not use the
`NUXT_PUBLIC_` prefix for them.

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev

# pnpm
pnpm dev

# yarn
yarn dev

# bun
bun run dev
```

## Production

### Debugging missing album covers

Filter the browser console by `[Toptop artwork]` and generate the image again.
Keep **Warnings** and **Errors** visible. Only failures are logged; successful
loads, recoveries and progress produce no messages. Failed cover requests include
the artist, album, provider, source URL and elapsed time. Failed server requests
also include the upstream HTTP status, resolved URL, content type and failure
stage. Network failures include the available error code, such as a DNS or
timeout error. These server diagnostics are returned to the browser even when
the image endpoint responds with HTTP 200 and `artwork: null`.

For failures while rendering the generated image, check `Canvas image failed`
and `Export resource failed`. Base64 image contents are omitted from logs.

Server logs use the same prefix and record failed upstream attempts even when
a later attempt recovers the cover.

Before trying Deezer, the server tries both Last.fm image hosts.
If both hosts fail, `failure.attempts` retains both
diagnostics. The image API request allows 15 seconds for the two host attempts;
each host has a 6-second budget including redirects and reading the image.

### Build

Build the application for production:

```bash
# npm
npm run build

# pnpm
pnpm build

# yarn
yarn build

# bun
bun run build
```

Locally preview production build:

```bash
# npm
npm run preview

# pnpm
pnpm preview

# yarn
yarn preview

# bun
bun run preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.
