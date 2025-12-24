import type { LoaderFunctionArgs } from "@remix-run/node";

/**
 * API endpoint that returns HTML content for the SDK Content block
 * This is a public endpoint that can be called from the storefront
 */
export const loader = async ({ request }: LoaderFunctionArgs) => {
  // Get query parameters if needed
  const url = new URL(request.url);
  const variant = url.searchParams.get("variant") || "default";

  console.log("[API /api/content] Request received, variant:", variant);

  // Generate HTML content based on variant
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
          <p>This HTML content was fetched from the app server.</p>
          <p>Timestamp: ${new Date().toISOString()}</p>
          <p>The SDK successfully loaded this content dynamically.</p>
        </div>
      `;
  }

  return new Response(htmlContent, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
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
