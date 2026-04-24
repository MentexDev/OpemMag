import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getCurrentTenantAdmin } from "@/lib/auth/current-tenant";
import {
  buildAuthorizeUrl,
  isShopifyConfigured,
  normalizeShopDomain,
} from "@/lib/shopify-oauth";

export const dynamic = "force-dynamic";

// Initiates the Shopify OAuth flow.
// The tenant-admin is logged in. Their tenant id is captured in the state cookie
// so the callback knows where to attach the resulting access token.
export async function GET(request: NextRequest) {
  if (!isShopifyConfigured()) {
    return NextResponse.json(
      { error: "Shopify OAuth no está configurado en el servidor." },
      { status: 503 }
    );
  }

  const ctx = await getCurrentTenantAdmin();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shopParam = request.nextUrl.searchParams.get("shop");
  if (!shopParam) {
    return NextResponse.json(
      { error: "Falta el parámetro shop (ej: mi-tienda.myshopify.com)" },
      { status: 400 }
    );
  }

  const shop = normalizeShopDomain(shopParam);
  if (!shop) {
    return NextResponse.json(
      { error: "Dominio Shopify inválido. Debe terminar en .myshopify.com" },
      { status: 400 }
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin;
  const redirectUri = `${appUrl}/api/shopify/callback`;
  const state = crypto.randomBytes(24).toString("hex");

  const authorizeUrl = buildAuthorizeUrl({ shop, state, redirectUri });

  const response = NextResponse.redirect(authorizeUrl);
  // Cookies linking the OAuth flow to this tenant. HTTP-only & short-lived.
  const cookieOpts = {
    httpOnly: true as const,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 60 * 10, // 10 minutes
    path: "/",
  };
  response.cookies.set("shopify_oauth_state", state, cookieOpts);
  response.cookies.set("shopify_oauth_tenant", ctx.tenant.id, cookieOpts);
  response.cookies.set("shopify_oauth_shop", shop, cookieOpts);
  return response;
}
