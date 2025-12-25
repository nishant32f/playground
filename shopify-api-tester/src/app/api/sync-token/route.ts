import { NextResponse } from "next/server";
import Database from "better-sqlite3";
import { PrismaClient } from "@prisma/client";
import path from "path";
import { existsSync } from "fs";

interface SourceSession {
  id: string;
  shop: string;
  accessToken: string;
  scope: string | null;
  isOnline: number;
}

// POST /api/sync-token - Read tokens directly from Remix app SQLite database
export async function POST() {
  const sourcePath = path.resolve(
    process.cwd(),
    "../test-theme-modifier-app/prisma/dev.sqlite"
  );
  const appName = "test-theme-modifier-app";

  try {
    // Check if source database exists
    if (!existsSync(sourcePath)) {
      return NextResponse.json(
        {
          success: false,
          error: `Source database not found: ${sourcePath}`,
        },
        { status: 404 }
      );
    }

    // Open source database (read-only)
    const sourceDb = new Database(sourcePath, { readonly: true });

    // Query offline sessions (app-level tokens)
    const sessions = sourceDb
      .prepare(
        `SELECT id, shop, accessToken, scope, isOnline
         FROM Session
         WHERE accessToken IS NOT NULL
           AND accessToken != ''
           AND isOnline = 0
         ORDER BY shop`
      )
      .all() as SourceSession[];

    sourceDb.close();

    if (sessions.length === 0) {
      return NextResponse.json({
        success: false,
        error: "No offline sessions found. Install the app in a store first.",
      });
    }

    // Initialize Prisma client for api-tester database
    const prisma = new PrismaClient();

    let imported = 0;
    let updated = 0;
    const results = [];

    for (const session of sessions) {
      try {
        const result = await prisma.storeCredential.upsert({
          where: {
            storeUrl_name: {
              storeUrl: session.shop,
              name: appName,
            },
          },
          update: {
            adminApiToken: session.accessToken,
            scopes: session.scope || "",
          },
          create: {
            name: appName,
            storeUrl: session.shop,
            adminApiToken: session.accessToken,
            scopes: session.scope || "",
            apiVersion: "2025-01",
          },
        });

        const wasCreated =
          result.createdAt.getTime() === result.updatedAt.getTime() ||
          Date.now() - result.createdAt.getTime() < 1000;

        if (wasCreated) {
          imported++;
          results.push({ shop: session.shop, status: "imported" });
        } else {
          updated++;
          results.push({ shop: session.shop, status: "updated" });
        }
      } catch (error) {
        results.push({
          shop: session.shop,
          status: "failed",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    await prisma.$disconnect();

    return NextResponse.json({
      success: true,
      message: `Synced ${imported + updated}/${sessions.length} stores (${imported} new, ${updated} updated)`,
      results,
    });
  } catch (error) {
    console.error("Error syncing token:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
