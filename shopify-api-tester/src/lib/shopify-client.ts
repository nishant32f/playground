import prisma from "./db";

export interface ShopifyClientConfig {
  storeUrl: string;
  accessToken: string;
  apiVersion: string;
}

export async function getStoreConfigById(
  id: string
): Promise<ShopifyClientConfig | null> {
  const store = await prisma.storeCredential.findUnique({
    where: { id },
  });

  if (!store) return null;

  return {
    storeUrl: store.storeUrl,
    accessToken: store.adminApiToken,
    apiVersion: store.apiVersion,
  };
}

export async function getActiveStoreConfig(): Promise<ShopifyClientConfig | null> {
  const store = await prisma.storeCredential.findFirst({
    where: { isActive: true },
  });

  if (!store) return null;

  return {
    storeUrl: store.storeUrl,
    accessToken: store.adminApiToken,
    apiVersion: store.apiVersion,
  };
}

export interface GraphQLResponse<T = unknown> {
  data: T | null;
  errors: Array<{ message: string; locations?: unknown[]; path?: string[] }> | null;
}

export async function shopifyGraphQL<T = unknown>(
  config: ShopifyClientConfig,
  query: string,
  variables: Record<string, unknown> = {}
): Promise<GraphQLResponse<T>> {
  const url = `https://${config.storeUrl}/admin/api/${config.apiVersion}/graphql.json`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": config.accessToken,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HTTP ${response.status}: ${text}`);
  }

  const json = await response.json();
  return {
    data: json.data ?? null,
    errors: json.errors ?? null,
  };
}
