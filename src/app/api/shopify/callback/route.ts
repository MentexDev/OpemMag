import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { encrypt } from "@/lib/crypto";
import {
  exchangeCodeForToken,
  registerWebhooks,
  validateCallbackHmac,
} from "@/lib/shopify-oauth";

export const dynamic = "force-dynamic";

function fail(reason: string, request: NextRequest): NextResponse {
  const url = new URL("/dashboard/configuracion", request.url);
  url.searchParams.set("shopify", "error");
  url.searchParams.set("reason", reason);
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const code = params.get("code");
  const shop = params.get("shop");
  const state = params.get("state");

  if (!code || !shop || !state) return fail("missing_params", request);

  // 1. Validate HMAC against query string
  if (!validateCallbackHmac(params)) return fail("invalid_hmac", request);

  // 2. Validate state nonce + tenant from cookies
  const cookieState = request.cookies.get("shopify_oauth_state")?.value;
  const cookieTenant = request.cookies.get("shopify_oauth_tenant")?.value;
  const cookieShop = request.cookies.get("shopify_oauth_shop")?.value;

  if (!cookieState || cookieState !== state) return fail("invalid_state", request);
  if (!cookieTenant) return fail("missing_tenant", request);
  if (!cookieShop || cookieShop !== shop) return fail("shop_mismatch", request);

  // 3. Exchange code for access token
  const result = await exchangeCodeForToken({ shop, code });
  if (!result) return fail("token_exchange_failed", request);

  // 4. Encrypt + persist
  const admin = createAdminClient();
  let encryptedToken: string;
  try {
    encryptedToken = encrypt(result.accessToken);
  } catch {
    return fail("encryption_failed", request);
  }

  const { error: updateError } = await admin
    .from("tenants")
    .update({
      shopify_domain: shop,
      shopify_token: encryptedToken,
      updated_at: new Date().toISOString(),
    })
    .eq("id", cookieTenant);

  if (updateError) {
    console.error("Failed to persist Shopify token", updateError);
    return fail("persist_failed", request);
  }

  // 5. Register webhooks (best-effort, non-blocking failure)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin;
  try {
    await registerWebhooks({ shop, accessToken: result.accessToken, appUrl });
  } catch (e) {
    console.error("Webhook registration failed", e);
  }

  // 6. Redirect back to settings with success flag, clear cookies
  const successUrl = new URL("/dashboard/configuracion", request.url);
  successUrl.searchParams.set("shopify", "connected");

  const response = NextResponse.redirect(successUrl);
  response.cookies.delete("shopify_oauth_state");
  response.cookies.delete("shopify_oauth_tenant");
  response.cookies.delete("shopify_oauth_shop");
  return response;
}
