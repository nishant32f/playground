import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

// GET /api/stores - List all store credentials
export async function GET() {
  try {
    const stores = await prisma.storeCredential.findMany({
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        name: true,
        storeUrl: true,
        scopes: true,
        apiVersion: true,
        isActive: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
        // Exclude tokens from list view for security
      },
    });
    return NextResponse.json(stores);
  } catch (error) {
    console.error("Error fetching stores:", error);
    return NextResponse.json(
      { error: "Failed to fetch stores" },
      { status: 500 }
    );
  }
}

// POST /api/stores - Create new store credential
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, storeUrl, adminApiToken, storefrontToken, scopes, apiVersion, notes } = body;

    if (!name || !storeUrl || !adminApiToken || !scopes) {
      return NextResponse.json(
        { error: "Missing required fields: name, storeUrl, adminApiToken, scopes" },
        { status: 400 }
      );
    }

    // Normalize store URL (remove https://, trailing slashes)
    const normalizedUrl = storeUrl
      .replace(/^https?:\/\//, "")
      .replace(/\/$/, "");

    const store = await prisma.storeCredential.create({
      data: {
        name,
        storeUrl: normalizedUrl,
        adminApiToken,
        storefrontToken: storefrontToken || null,
        scopes,
        apiVersion: apiVersion || "2025-01",
        notes: notes || null,
      },
    });

    return NextResponse.json(store, { status: 201 });
  } catch (error) {
    console.error("Error creating store:", error);
    if ((error as { code?: string }).code === "P2002") {
      return NextResponse.json(
        { error: "A store with this name and URL already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create store" },
      { status: 500 }
    );
  }
}
