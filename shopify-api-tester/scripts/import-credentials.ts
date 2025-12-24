/**
 * Import credentials from Shopify app SQLite databases into shopify-api-tester
 *
 * Usage:
 *   npx tsx scripts/import-credentials.ts [options]
 *
 * Options:
 *   --source <path>    Path to source SQLite database (default: ../test-theme-modifier-app/prisma/dev.sqlite)
 *   --app-name <name>  Name to identify this app (default: derived from source path)
 *   --dry-run          Show what would be imported without making changes
 *   --list             Just list available credentials in the source database
 */

import { PrismaClient } from "@prisma/client";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

// Get current directory (ESM-compatible)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parse command line arguments
const args = process.argv.slice(2);
const getArg = (name: string): string | undefined => {
  const index = args.indexOf(`--${name}`);
  return index !== -1 ? args[index + 1] : undefined;
};
const hasFlag = (name: string): boolean => args.includes(`--${name}`);

const sourcePath =
  getArg("source") ||
  path.resolve(__dirname, "../../test-theme-modifier-app/prisma/dev.sqlite");
const appName = getArg("app-name") || path.basename(path.dirname(path.dirname(sourcePath)));
const dryRun = hasFlag("dry-run");
const listOnly = hasFlag("list");

interface SourceSession {
  id: string;
  shop: string;
  accessToken: string;
  scope: string | null;
  isOnline: number;
  expires: string | null;
}

async function main() {
  console.log("=== Shopify Credentials Import ===\n");

  // Check if source database exists
  const fs = await import("fs");
  if (!fs.existsSync(sourcePath)) {
    console.error(`Source database not found: ${sourcePath}`);
    console.log("\nUsage: npx tsx scripts/import-credentials.ts --source <path-to-sqlite>");
    console.log("\nExamples:");
    console.log("  npx tsx scripts/import-credentials.ts");
    console.log("  npx tsx scripts/import-credentials.ts --source ../my-app/prisma/dev.sqlite --app-name my-app");
    process.exit(1);
  }

  console.log(`Source: ${sourcePath}`);
  console.log(`App Name: ${appName}`);
  if (dryRun) console.log("Mode: DRY RUN (no changes will be made)");
  console.log("");

  // Open source database (read-only)
  const sourceDb = new Database(sourcePath, { readonly: true });

  // Query sessions from source
  const sessions = sourceDb
    .prepare(
      `SELECT id, shop, accessToken, scope, isOnline, expires
       FROM Session
       WHERE accessToken IS NOT NULL AND accessToken != ''
       ORDER BY shop`
    )
    .all() as SourceSession[];

  if (sessions.length === 0) {
    console.log("No sessions with access tokens found in source database.");
    sourceDb.close();
    return;
  }

  console.log(`Found ${sessions.length} session(s) with access tokens:\n`);

  // Group by shop (there might be online and offline sessions)
  const shopSessions = new Map<string, SourceSession[]>();
  for (const session of sessions) {
    const existing = shopSessions.get(session.shop) || [];
    existing.push(session);
    shopSessions.set(session.shop, existing);
  }

  // Display found credentials
  for (const [shop, shopSessionList] of shopSessions) {
    console.log(`  Store: ${shop}`);
    for (const s of shopSessionList) {
      const tokenPreview = s.accessToken.substring(0, 12) + "...";
      const type = s.isOnline ? "online" : "offline";
      console.log(`    - ${type} session: ${tokenPreview} (scopes: ${s.scope || "N/A"})`);
    }
  }
  console.log("");

  if (listOnly) {
    sourceDb.close();
    return;
  }

  if (dryRun) {
    console.log("DRY RUN: Would import the following credentials:");
    for (const [shop, shopSessionList] of shopSessions) {
      // Prefer offline session (longer-lived)
      const session = shopSessionList.find((s) => !s.isOnline) || shopSessionList[0];
      console.log(`  - ${appName} @ ${shop}`);
    }
    sourceDb.close();
    return;
  }

  // Initialize target Prisma client
  const prisma = new PrismaClient();

  let imported = 0;
  let updated = 0;
  let skipped = 0;

  for (const [shop, shopSessionList] of shopSessions) {
    // Prefer offline session (longer-lived token)
    const session = shopSessionList.find((s) => !s.isOnline) || shopSessionList[0];

    try {
      const result = await prisma.storeCredential.upsert({
        where: {
          storeUrl_name: {
            storeUrl: shop,
            name: appName,
          },
        },
        update: {
          adminApiToken: session.accessToken,
          scopes: session.scope || "",
        },
        create: {
          name: appName,
          storeUrl: shop,
          adminApiToken: session.accessToken,
          scopes: session.scope || "",
          apiVersion: "2025-01",
        },
      });

      // Check if it was an update or insert by comparing timestamps
      const wasCreated =
        result.createdAt.getTime() === result.updatedAt.getTime() ||
        Date.now() - result.createdAt.getTime() < 1000;

      if (wasCreated) {
        console.log(`✓ Imported: ${appName} @ ${shop}`);
        imported++;
      } else {
        console.log(`✓ Updated: ${appName} @ ${shop}`);
        updated++;
      }
    } catch (error) {
      console.error(`✗ Failed: ${appName} @ ${shop}: ${error}`);
      skipped++;
    }
  }

  console.log(`\nSummary: ${imported} imported, ${updated} updated, ${skipped} failed`);

  await prisma.$disconnect();
  sourceDb.close();
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
