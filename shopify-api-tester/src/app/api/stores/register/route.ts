import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

// POST /api/stores/register - Auto-register credentials from test apps
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { appName, storeUrl, adminApiToken, storefrontToken, scopes, apiVersion } = body;

    if (!appName || !storeUrl || !adminApiToken || !scopes) {
      return NextResponse.json(
        { error: "Missing required fields: appName, storeUrl, adminApiToken, scopes" },
        { status: 400 }
      );
    }

    // Normalize store URL
    const normalizedUrl = storeUrl
      .replace(/^https?:\/\//, "")
      .replace(/\/$/, "");

    // Use upsert to update existing or create new
    const store = await prisma.storeCredential.upsert({
      where: {
        storeUrl_name: {
          storeUrl: normalizedUrl,
          name: appName,
        },
      },
      update: {
        adminApiToken,
        storefrontToken: storefrontToken || null,
        scopes,
        apiVersion: apiVersion || "2025-01",
      },
      create: {
        name: appName,
        storeUrl: normalizedUrl,
        adminApiToken,
        storefrontToken: storefrontToken || null,
        scopes,
        apiVersion: apiVersion || "2025-01",
      },
    });

    console.log(`[Register] Store credential registered/updated: ${appName} @ ${normalizedUrl}`);

    return NextResponse.json({
      success: true,
      id: store.id,
      message: "Credentials registered successfully",
    });
  } catch (error) {
    console.error("Error registering store:", error);
    return NextResponse.json(
      { error: "Failed to register store credentials" },
      { status: 500 }
    );
  }
}
