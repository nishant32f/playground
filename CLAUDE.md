# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Structure

This is a monorepo containing three projects for Shopify development:

- **shopify-api-tester/**: Admin UI for testing Shopify APIs with multiple store credentials (Next.js)
- **test-theme-modifier-app/**: A Shopify embedded app built with Remix
- **shopify-theme-scripts/**: Standalone Node.js scripts for testing Shopify Theme GraphQL APIs (legacy, prefer shopify-api-tester)

## Commands

### Shopify API Tester (shopify-api-tester/)

```bash
cd shopify-api-tester

# Development
npm run dev              # Start dev server on port 3100
npm run build            # Build for production

# Database
npm run setup            # Generate Prisma client and create database
npm run db:studio        # Open Prisma Studio to view/edit data

# Import credentials from Shopify app databases
npm run import           # Import from test-theme-modifier-app (default)
npm run import:list      # List available credentials without importing
npm run import:dry-run   # Preview what would be imported

# Import from a different app
npm run import -- --source ../other-app/prisma/dev.sqlite --app-name other-app
```

**Features:**
- Web UI for managing multiple store credentials
- Test Shopify APIs with pre-defined actions (themes, products, etc.)
- Auto-registers credentials from test apps on OAuth (when running)
- Import script to bulk-import credentials from existing Shopify app databases

### Shopify Remix App (test-theme-modifier-app/)

```bash
cd test-theme-modifier-app

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

**Environment Variables (optional):**
- `API_TESTER_URL`: URL of shopify-api-tester (default: http://localhost:3100)
- `APP_NAME`: Name for registering with API tester (default: test-theme-modifier-app)

### Theme Scripts (shopify-theme-scripts/) - Legacy

```bash
cd shopify-theme-scripts

npm run extract-token    # Get access token from app's SQLite database
npm run list-themes      # List all themes in the store
npm run get-theme-files -- --theme-id "gid://shopify/OnlineStoreTheme/ID"
npm run get-file-content -- --theme-id "..." --filename "sections/header.liquid"
npm run create-file -- --theme-id "..." --filename "snippets/test.liquid" --content "<div>...</div>"
npm run edit-file -- --theme-id "..." --filename "snippets/test.liquid" --content "..."
npm run delete-file -- --theme-id "..." --filename "snippets/test.liquid"
```

## Architecture

### Shopify API Tester

- Next.js 15 with App Router
- SQLite database (Prisma) for storing multiple store credentials
- Stores: name, storeUrl, adminApiToken, storefrontToken, scopes, apiVersion
- Auto-register endpoint: `POST /api/stores/register` (called by test apps after OAuth)
- Runs on port 3100 to avoid conflicts with other dev servers

### Shopify Remix App

- Uses `@shopify/shopify-app-remix` for authentication and Shopify API access
- Session storage via Prisma with SQLite (`prisma/schema.prisma`)
- App configuration in `shopify.app.toml` (scopes: `read_themes`, `write_themes`)
- Shopify client exported from `app/shopify.server.ts` - use `shopify.authenticate.admin(request)` for API calls
- Auto-registers with shopify-api-tester on OAuth via `afterAuth` hook
- Webhooks defined in routes: `app/routes/webhooks.*.tsx`
- Uses Polaris for UI components

### Theme Scripts

- Reads access tokens from the Remix app's SQLite database
- Requires `.env` file with `SHOPIFY_ACCESS_TOKEN` and `SHOPIFY_STORE` (copy from `.env.example`)
- Theme IDs use format: `gid://shopify/OnlineStoreTheme/123456789`

## Workflow

1. Start shopify-api-tester: `cd shopify-api-tester && npm run dev`
2. Start test app: `cd test-theme-modifier-app && npm run dev`
3. Install the test app in a Shopify store
4. Credentials are auto-registered in shopify-api-tester
5. Use the API tester UI at http://localhost:3100 to test Shopify APIs
