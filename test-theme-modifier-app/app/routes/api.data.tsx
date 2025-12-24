import type { LoaderFunctionArgs } from "@remix-run/node";

/**
 * API endpoint that returns JSON data for the SDK Content block
 * This is a public endpoint that can be called from the storefront
 */
export const loader = async ({ request }: LoaderFunctionArgs) => {
  // Get query parameters if needed
  const url = new URL(request.url);
  const type = url.searchParams.get("type") || "general";

  console.log("[API /api/data] Request received, type:", type);

  // Generate JSON response based on type
  let data: Record<string, unknown>;

  switch (type) {
    case "products":
      data = {
        success: true,
        type: "products",
        timestamp: new Date().toISOString(),
        items: [
          { id: 1, name: "Product A", price: 29.99, inStock: true },
          { id: 2, name: "Product B", price: 49.99, inStock: true },
          { id: 3, name: "Product C", price: 19.99, inStock: false },
        ],
        total: 3,
      };
      break;

    case "config":
      data = {
        success: true,
        type: "config",
        timestamp: new Date().toISOString(),
        settings: {
          theme: "light",
          showPrices: true,
          currency: "USD",
          locale: "en-US",
        },
      };
      break;

    case "stats":
      data = {
        success: true,
        type: "stats",
        timestamp: new Date().toISOString(),
        metrics: {
          visitors: Math.floor(Math.random() * 1000),
          pageViews: Math.floor(Math.random() * 5000),
          conversionRate: (Math.random() * 5).toFixed(2) + "%",
        },
      };
      break;

    default:
      data = {
        success: true,
        type: "general",
        message: "Hello from the API!",
        timestamp: new Date().toISOString(),
        description: "This JSON data was fetched from the app server.",
        items: ["Item 1", "Item 2", "Item 3"],
        metadata: {
          version: "1.0.0",
          environment: process.env.NODE_ENV || "development",
        },
      };
  }

  return Response.json(data, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Cache-Control": "public, max-age=60",
    },
  });
};

/**
 * Handle CORS preflight requests
 */
export const action = async ({ request }: LoaderFunctionArgs) => {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  return new Response("Method not allowed", { status: 405 });
};
