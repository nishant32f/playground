import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";

/**
 * App Proxy Route Handler
 *
 * This handles requests from the storefront via Shopify's App Proxy.
 * URL pattern: https://your-store.myshopify.com/apps/sdk/*
 *
 * The proxy forwards requests to this route, allowing the storefront
 * to make API calls without CORS issues.
 */

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const path = params["*"] || "";

  console.log("[App Proxy] Request received:", path);
  console.log("[App Proxy] Query params:", url.searchParams.toString());

  // Route to appropriate handler based on path
  switch (path) {
    case "content":
      return handleContent(url.searchParams);

    case "data":
      return handleData(url.searchParams);

    case "health":
      return Response.json({ status: "ok", timestamp: new Date().toISOString() });

    default:
      return Response.json(
        { error: "Not found", path },
        { status: 404 }
      );
  }
};

/**
 * Handle HTML content requests
 */
function handleContent(searchParams: URLSearchParams) {
  const variant = searchParams.get("variant") || "default";

  let htmlContent: string;

  switch (variant) {
    case "promo":
      htmlContent = `
        <div class="app-content app-content--promo">
          <h3>Special Offer!</h3>
          <p>Get 20% off your next purchase with code: <strong>SAVE20</strong></p>
          <p>Valid until: ${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}</p>
        </div>
      `;
      break;

    case "announcement":
      htmlContent = `
        <div class="app-content app-content--announcement">
          <h3>New Arrivals!</h3>
          <p>Check out our latest collection of products.</p>
          <p>Fresh styles added weekly.</p>
        </div>
      `;
      break;

    default:
      htmlContent = `
        <div class="app-content">
          <h3>Hello from the App!</h3>
          <p>This content was loaded via App Proxy.</p>
          <p>Timestamp: ${new Date().toISOString()}</p>
          <p>No CORS needed - requests go through your store's domain!</p>
        </div>
      `;
  }

  return new Response(htmlContent, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}

/**
 * Handle JSON data requests
 */
function handleData(searchParams: URLSearchParams) {
  const type = searchParams.get("type") || "general";

  let data: Record<string, unknown>;

  switch (type) {
    case "products":
      data = {
        success: true,
        type: "products",
        source: "app-proxy",
        timestamp: new Date().toISOString(),
        items: [
          { id: 1, name: "Product A", price: 29.99, inStock: true },
          { id: 2, name: "Product B", price: 49.99, inStock: true },
          { id: 3, name: "Product C", price: 19.99, inStock: false },
        ],
      };
      break;

    case "config":
      data = {
        success: true,
        type: "config",
        source: "app-proxy",
        timestamp: new Date().toISOString(),
        settings: {
          theme: "light",
          showPrices: true,
          currency: "USD",
        },
      };
      break;

    default:
      data = {
        success: true,
        type: "general",
        source: "app-proxy",
        message: "Hello from the App Proxy!",
        timestamp: new Date().toISOString(),
        items: ["Item 1", "Item 2", "Item 3"],
      };
  }

  return Response.json(data);
}

/**
 * Handle POST requests if needed
 */
export const action = async ({ request, params }: ActionFunctionArgs) => {
  const path = params["*"] || "";

  console.log("[App Proxy] POST request:", path);

  return Response.json({
    success: true,
    message: "POST received",
    path,
    timestamp: new Date().toISOString(),
  });
};
