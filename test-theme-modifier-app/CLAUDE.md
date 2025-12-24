# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm run dev              # Start dev server with Shopify CLI (includes tunnel)
npm run build            # Build for production

# Database
npm run setup            # Generate Prisma client and run migrations
npm run prisma           # Access Prisma CLI

# Deployment
npm run deploy           # Deploy app to Shopify
npm run lint             # Run ESLint
```

## Architecture

This is a Shopify embedded app built with Remix for managing store themes via the Theme GraphQL API.

### Key Files

- `app/shopify.server.ts` - Shopify client configuration. Use `shopify.authenticate.admin(request)` for API calls
- `app/db.server.ts` - Prisma database client
- `prisma/schema.prisma` - Database schema (SQLite, stores sessions)
- `shopify.app.toml` - App configuration (scopes: `read_themes`, `write_themes`)

### Route Structure

- `app/routes/app.tsx` - Main app layout with navigation (wraps all `/app/*` routes)
- `app/routes/app._index.tsx` - Home page
- `app/routes/app.themes.tsx` - Theme manager page (list themes, view/edit/create/delete files)
- `app/routes/webhooks.*.tsx` - Webhook handlers

### Authentication Pattern

All protected routes use the Shopify authenticate middleware:

```typescript
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  // admin.graphql() for API calls
};
```

### Theme API Operations

The app uses these GraphQL operations in `app/routes/app.themes.tsx`:
- `GetThemes` - List all themes
- `GetThemeFiles` - Get files for a theme (up to 250 files)
- `ThemeFilesUpsert` - Create/update theme files
- `ThemeFilesDelete` - Delete theme files

### UI Components

Uses Shopify Polaris for UI and App Bridge for embedded app features:
- `@shopify/polaris` - Design system components
- `@shopify/app-bridge-react` - `NavMenu`, `TitleBar` for embedded integration

### Embedded App Considerations

- Use `Link` from `@remix-run/react` or `@shopify/polaris` (not `<a>`)
- Use `redirect` from `authenticate.admin` (not from `@remix-run/node`)
- Use `useSubmit` or `<Form/>` from `@remix-run/react` (not lowercase `<form/>`)
