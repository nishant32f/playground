import { NextRequest, NextResponse } from "next/server";
import { getStoreConfigById, shopifyGraphQL } from "@/lib/shopify-client";
import { GET_SHOP } from "@/lib/graphql/themes";

// GET /api/shopify/shop - Get shop info (test connection)
export async function GET(request: NextRequest) {
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
    const result = await shopifyGraphQL(config, GET_SHOP);

    if (result.errors) {
      return NextResponse.json(
        { error: "GraphQL errors", details: result.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error("Error fetching shop:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
