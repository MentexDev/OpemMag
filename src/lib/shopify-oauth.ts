import crypto from "crypto";

export const SHOPIFY_SCOPES = [
  "read_products",
  "read_orders",
  "read_customers",
  "read_inventory",
].join(",");

const SHOP_DOMAIN_REGEX = /^[a-z0-9][a-z0-9-]*\.myshopify\.com$/i;

export function isShopifyConfigured(): boolean {
  return !!(process.env.SHOPIFY_API_KEY && process.env.SHOPIFY_API_SECRET);
}

export function normalizeShopDomain(input: string): string | null {
  const cleaned = input
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "");

  // Allow user to type just "mi-tienda" → infer ".myshopify.com"
  const candidate = cleaned.includes(".") ? cleaned : `${cleaned}.myshopify.com`;
  return SHOP_DOMAIN_REGEX.test(candidate) ? candidate : null;
}

/**
 * Build the Shopify OAuth authorize URL.
 * https://shopify.dev/docs/apps/build/authentication-authorization/access-tokens/authorization-code-grant
 */
export function buildAuthorizeUrl(opts: {
  shop: string;
  state: string;
  redirectUri: string;
}): string {
  const apiKey = process.env.SHOPIFY_API_KEY;
  if (!apiKey) throw new Error("SHOPIFY_API_KEY missing");

  const params = new URLSearchParams({
    client_id: apiKey,
    scope: SHOPIFY_SCOPES,
    redirect_uri: opts.redirectUri,
    state: opts.state,
    "grant_options[]": "",
  });
  return `https://${opts.shop}/admin/oauth/authorize?${params.toString()}`;
}

/**
 * Validate the HMAC signature on Shopify OAuth callback query params.
 */
export function validateCallbackHmac(searchParams: URLSearchParams): boolean {
  const secret = process.env.SHOPIFY_API_SECRET;
  if (!secret) return false;

  const hmac = searchParams.get("hmac");
  if (!hmac) return false;

  const params = new URLSearchParams(searchParams);
  params.delete("hmac");
  params.delete("signature");

  // Sort keys lexicographically and join as key=value&key=value
  const sortedKeys = [...params.keys()].sort();
  const message = sortedKeys.map((k) => `${k}=${params.get(k)}`).join("&");

  const computed = crypto.createHmac("sha256", secret).update(message).digest("hex");
  // Use constant-time comparison
  try {
    return crypto.timingSafeEqual(Buffer.from(computed, "hex"), Buffer.from(hmac, "hex"));
  } catch {
    return false;
  }
}

/**
 * Exchange the authorization `code` for a permanent access token.
 */
export async function exchangeCodeForToken(opts: {
  shop: string;
  code: string;
}): Promise<{ accessToken: string; scope: string } | null> {
  const apiKey = process.env.SHOPIFY_API_KEY;
  const apiSecret = process.env.SHOPIFY_API_SECRET;
  if (!apiKey || !apiSecret) return null;

  const res = await fetch(`https://${opts.shop}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: apiKey,
      client_secret: apiSecret,
      code: opts.code,
    }),
  });

  if (!res.ok) {
    console.error("Shopify token exchange failed", res.status, await res.text());
    return null;
  }
  const data = await res.json();
  return { accessToken: data.access_token as string, scope: data.scope as string };
}

/**
 * Validate HMAC of an incoming Shopify webhook request body.
 */
export function validateWebhookHmac(rawBody: string, hmacHeader: string | null): boolean {
  const secret = process.env.SHOPIFY_API_SECRET;
  if (!secret || !hmacHeader) return false;
  const computed = crypto
    .createHmac("sha256", secret)
    .update(rawBody, "utf8")
    .digest("base64");
  try {
    return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(hmacHeader));
  } catch {
    return false;
  }
}

/**
 * Register webhooks via Shopify Admin API.
 */
export async function registerWebhooks(opts: {
  shop: string;
  accessToken: string;
  appUrl: string;
}): Promise<void> {
  const topics = [
    { topic: "orders/create", path: `/api/shopify/webhooks/orders-create` },
    { topic: "app/uninstalled", path: `/api/shopify/webhooks/app-uninstalled` },
  ];

  for (const { topic, path } of topics) {
    const res = await fetch(
      `https://${opts.shop}/admin/api/2024-10/webhooks.json`,
      {
        method: "POST",
        headers: {
          "X-Shopify-Access-Token": opts.accessToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          webhook: {
            topic,
            address: `${opts.appUrl}${path}`,
            format: "json",
          },
        }),
      }
    );
    if (!res.ok && res.status !== 422) {
      // 422 = already exists, ignore
      console.error(`Failed to register webhook ${topic}`, res.status, await res.text());
    }
  }
}
