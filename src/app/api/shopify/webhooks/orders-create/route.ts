import { NextRequest, NextResponse } from "next/server";
import { validateWebhookHmac } from "@/lib/shopify-oauth";
import { createAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

interface ShopifyOrder {
  id: number;
  total_price: string;
  customer?: { first_name?: string; last_name?: string; email?: string } | null;
  note_attributes?: { name: string; value: string }[];
  landing_site?: string;
  referring_site?: string;
  created_at?: string;
}

function extractReferralCode(order: ShopifyOrder): string | null {
  const attr = order.note_attributes?.find(
    (a) => a.name === "ref" || a.name === "referral"
  );
  if (attr?.value) return attr.value;

  const landing = order.landing_site || order.referring_site || "";
  if (landing) {
    try {
      const url = new URL(
        landing.startsWith("http") ? landing : `https://example.com${landing}`
      );
      const ref = url.searchParams.get("ref");
      if (ref) return ref;
    } catch {}
  }
  return null;
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const hmac = request.headers.get("x-shopify-hmac-sha256");
  if (!validateWebhookHmac(rawBody, hmac)) {
    return NextResponse.json({ error: "Invalid HMAC" }, { status: 401 });
  }

  const shop = request.headers.get("x-shopify-shop-domain");
  if (!shop) return NextResponse.json({ error: "Missing shop header" }, { status: 400 });

  const admin = createAdminClient();
  const { data: tenant } = await admin
    .from("tenants")
    .select("id, is_active, commission_rate")
    .eq("shopify_domain", shop)
    .maybeSingle();

  if (!tenant || !tenant.is_active) {
    return NextResponse.json({ ok: true, ignored: "tenant not found or inactive" });
  }

  let order: ShopifyOrder;
  try {
    order = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const referralCode = extractReferralCode(order);
  if (!referralCode) {
    return NextResponse.json({ ok: true, ignored: "no referral" });
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("id")
    .eq("tenant_id", tenant.id)
    .eq("referral_code", referralCode)
    .maybeSingle();

  if (!profile) {
    return NextResponse.json({ ok: true, ignored: "referral not found" });
  }

  const customerName = order.customer
    ? `${order.customer.first_name ?? ""} ${order.customer.last_name ?? ""}`.trim() || null
    : null;

  const saleAmount = Number(order.total_price);
  const commissionRate = Number(tenant.commission_rate ?? 15) / 100;

  const { error } = await admin.from("sales").insert({
    tenant_id: tenant.id,
    seller_id: profile.id,
    amount: saleAmount,
    commission_amt: Math.round(saleAmount * commissionRate * 100) / 100,
    referral_code: referralCode,
    customer_name: customerName,
    notes: `Shopify order #${order.id}`,
    status: "confirmed",
    sale_date: order.created_at
      ? new Date(order.created_at).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10),
  });

  if (error) {
    console.error("sale insert failed", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
