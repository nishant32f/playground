import { NextRequest, NextResponse } from "next/server";
import { getStoreConfigById, shopifyGraphQL } from "@/lib/shopify-client";
import { GET_THEME_FILES } from "@/lib/graphql/themes";

interface RouteParams {
  params: Promise<{ themeId: string }>;
}

// GET /api/shopify/themes/[themeId] - Get theme details with files
export async function GET(request: NextRequest, { params }: RouteParams) {
  const storeId = request.headers.get("X-Store-Id");

  if (!storeId) {
    return NextResponse.json(
      { error: "Missing X-Store-Id header" },
      { status: 400 }
    );
  }

  const config = await getStoreConfigById(storeId);

  if (!config) {
    return NextResponse.json({ error: "Store not found" }, { status: 404 });
  }

  try {
    const { themeId } = await params;
    // The themeId comes URL-encoded, need to decode it
    const decodedThemeId = decodeURIComponent(themeId);

    const result = await shopifyGraphQL(config, GET_THEME_FILES, {
      themeId: decodedThemeId,
    });

    if (result.errors) {
      return NextResponse.json(
        { error: "GraphQL errors", details: result.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error("Error fetching theme:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
