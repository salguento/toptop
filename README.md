# Nuxt Minimal Starter

Look at the [Nuxt documentation](https://nuxt.com/docs/getting-started/introduction) to learn more.

## Setup

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
