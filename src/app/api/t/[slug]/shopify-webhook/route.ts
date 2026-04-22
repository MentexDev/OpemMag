import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

interface ShopifyOrder {
  id: number;
  total_price: string;
  customer?: { first_name?: string; last_name?: string; email?: string } | null;
  note_attributes?: { name: string; value: string }[];
  landing_site?: string;
  referring_site?: string;
  cart_token?: string;
  created_at?: string;
}

function extractReferralCode(order: ShopifyOrder): string | null {
  // 1. note_attributes (preferred)
  const attr = order.note_attributes?.find(a => a.name === "ref" || a.name === "referral");
  if (attr?.value) return attr.value;

  // 2. landing_site (URL the customer came from)
  const landing = order.landing_site || order.referring_site || "";
  if (landing) {
    try {
      const url = new URL(landing.startsWith("http") ? landing : `https://example.com${landing}`);
      const ref = url.searchParams.get("ref");
      if (ref) return ref;
    } catch {}
  }

  return null;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const admin = createAdminClient();

  // Find tenant
  const { data: tenant } = await admin
    .from("tenants")
    .select("id, shopify_domain, is_active")
    .eq("slug", slug)
    .maybeSingle();

  if (!tenant || !tenant.is_active) {
    return NextResponse.json({ error: "Tienda no encontrada" }, { status: 404 });
  }

  // Verify Shopify HMAC signature (per-tenant secret stored in env or per-tenant column later)
  const sharedSecret = process.env.SHOPIFY_WEBHOOK_SECRET;
  const hmacHeader = request.headers.get("x-shopify-hmac-sha256");
  const rawBody = await request.text();

  if (sharedSecret && hmacHeader) {
    const computed = crypto
      .createHmac("sha256", sharedSecret)
      .update(rawBody, "utf8")
      .digest("base64");
    if (computed !== hmacHeader) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  }

  let order: ShopifyOrder;
  try {
    order = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const referralCode = extractReferralCode(order);
  if (!referralCode) {
    // Order without referral — log and ignore
    return NextResponse.json({ ok: true, ignored: "no referral code" });
  }

  // Find seller by referral_code within this tenant
  const { data: profile } = await admin
    .from("profiles")
    .select("id")
    .eq("tenant_id", tenant.id)
    .eq("referral_code", referralCode)
    .maybeSingle();

  if (!profile) {
    return NextResponse.json({ ok: true, ignored: "referral code not found" });
  }

  // Insert sale (idempotent via unique constraint on referral_code + amount + date — best-effort)
  const customerName = order.customer
    ? `${order.customer.first_name ?? ""} ${order.customer.last_name ?? ""}`.trim() || null
    : null;

  const { error } = await admin.from("sales").insert({
    tenant_id: tenant.id,
    seller_id: profile.id,
    amount: Number(order.total_price),
    referral_code: referralCode,
    customer_name: customerName,
    notes: `Shopify order #${order.id}`,
    status: "confirmed",
    sale_date: order.created_at ? new Date(order.created_at).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
  });

  if (error) {
    console.error("sale insert error", error);
    return NextResponse.json({ error: "Error registering sale" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
