import { NextRequest, NextResponse } from "next/server";
import { getStoreConfigById, shopifyGraphQL } from "@/lib/shopify-client";
import {
  GET_FILE_CONTENT,
  UPSERT_THEME_FILE,
  DELETE_THEME_FILE,
} from "@/lib/graphql/themes";

interface RouteParams {
  params: Promise<{ themeId: string }>;
}

// GET /api/shopify/themes/[themeId]/files?filename=... - Get file content
export async function GET(request: NextRequest, { params }: RouteParams) {
  const storeId = request.headers.get("X-Store-Id");

  if (!storeId) {
    return NextResponse.json(
      { error: "Missing X-Store-Id header" },
      { status: 400 }
    );
  }

  const { searchParams } = new URL(request.url);
  const filename = searchParams.get("filename");

  if (!filename) {
    return NextResponse.json(
      { error: "Missing filename query parameter" },
      { status: 400 }
    );
  }

  const config = await getStoreConfigById(storeId);

  if (!config) {
    return NextResponse.json({ error: "Store not found" }, { status: 404 });
  }

  try {
    const { themeId } = await params;
    const decodedThemeId = decodeURIComponent(themeId);

    const result = await shopifyGraphQL(config, GET_FILE_CONTENT, {
      themeId: decodedThemeId,
      filenames: [filename],
    });

    if (result.errors) {
      return NextResponse.json(
        { error: "GraphQL errors", details: result.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error("Error fetching file content:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// POST /api/shopify/themes/[themeId]/files - Create or update file
export async function POST(request: NextRequest, { params }: RouteParams) {
  const storeId = request.headers.get("X-Store-Id");

  if (!storeId) {
    return NextResponse.json(
      { error: "Missing X-Store-Id header" },
      { status: 400 }
    );
  }

  const body = await request.json();
  const { filename, content } = body;

  if (!filename || content === undefined) {
    return NextResponse.json(
      { error: "Missing required fields: filename, content" },
      { status: 400 }
    );
  }

  const config = await getStoreConfigById(storeId);

  if (!config) {
    return NextResponse.json({ error: "Store not found" }, { status: 404 });
  }

  try {
    const { themeId } = await params;
    const decodedThemeId = decodeURIComponent(themeId);

    const result = await shopifyGraphQL(config, UPSERT_THEME_FILE, {
      themeId: decodedThemeId,
      files: [
        {
          filename,
          body: {
            type: "TEXT",
            value: content,
          },
        },
      ],
    });

    if (result.errors) {
      return NextResponse.json(
        { error: "GraphQL errors", details: result.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error("Error upserting file:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// DELETE /api/shopify/themes/[themeId]/files - Delete file
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const storeId = request.headers.get("X-Store-Id");

  if (!storeId) {
    return NextResponse.json(
      { error: "Missing X-Store-Id header" },
      { status: 400 }
    );
  }

  const { searchParams } = new URL(request.url);
  const filename = searchParams.get("filename");

  if (!filename) {
    return NextResponse.json(
      { error: "Missing filename query parameter" },
      { status: 400 }
    );
  }

  const config = await getStoreConfigById(storeId);

  if (!config) {
    return NextResponse.json({ error: "Store not found" }, { status: 404 });
  }

  try {
    const { themeId } = await params;
    const decodedThemeId = decodeURIComponent(themeId);

    const result = await shopifyGraphQL(config, DELETE_THEME_FILE, {
      themeId: decodedThemeId,
      files: [filename],
    });

    if (result.errors) {
      return NextResponse.json(
        { error: "GraphQL errors", details: result.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error("Error deleting file:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
