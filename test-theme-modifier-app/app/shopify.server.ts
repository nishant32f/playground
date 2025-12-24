import "@shopify/shopify-app-remix/adapters/node";
import {
  ApiVersion,
  AppDistribution,
  shopifyApp,
} from "@shopify/shopify-app-remix/server";
import { PrismaSessionStorage } from "@shopify/shopify-app-session-storage-prisma";
import prisma from "./db.server";

// Register credentials with shopify-api-tester after successful OAuth
async function registerWithApiTester(session: {
  shop: string;
  accessToken?: string;
  scope?: string;
}) {
  const apiTesterUrl = process.env.API_TESTER_URL || "http://localhost:3100";
  const appName = process.env.APP_NAME || "test-theme-modifier-app";

  if (!session.accessToken) {
    console.log("[API Tester] No access token in session, skipping registration");
    return;
  }

  try {
    const response = await fetch(`${apiTesterUrl}/api/stores/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        appName,
        storeUrl: session.shop,
        adminApiToken: session.accessToken,
        scopes: session.scope || process.env.SCOPES || "",
        apiVersion: ApiVersion.January25,
      }),
    });

    if (response.ok) {
      console.log(`[API Tester] Registered credentials for ${session.shop}`);
    } else {
      const error = await response.text();
      console.error(`[API Tester] Failed to register: ${error}`);
    }
  } catch (error) {
    // Don't fail the auth flow if API tester is not running
    console.log(`[API Tester] Could not connect (is it running?): ${error}`);
  }
}

const shopify = shopifyApp({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET || "",
  apiVersion: ApiVersion.January25,
  scopes: process.env.SCOPES?.split(","),
  appUrl: process.env.SHOPIFY_APP_URL || "",
  authPathPrefix: "/auth",
  sessionStorage: new PrismaSessionStorage(prisma),
  distribution: AppDistribution.AppStore,
  hooks: {
    afterAuth: async ({ session }) => {
      // Register with shopify-api-tester if running
      await registerWithApiTester(session);
    },
  },
  future: {
    unstable_newEmbeddedAuthStrategy: true,
    removeRest: true,
    expiringOfflineAccessTokens: true,
  },
  ...(process.env.SHOP_CUSTOM_DOMAIN
    ? { customShopDomains: [process.env.SHOP_CUSTOM_DOMAIN] }
    : {}),
});

export default shopify;
export const apiVersion = ApiVersion.January25;
export const addDocumentResponseHeaders = shopify.addDocumentResponseHeaders;
export const authenticate = shopify.authenticate;
export const unauthenticated = shopify.unauthenticated;
export const login = shopify.login;
export const registerWebhooks = shopify.registerWebhooks;
export const sessionStorage = shopify.sessionStorage;
