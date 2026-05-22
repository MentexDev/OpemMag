import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function getTenantId(userId: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("tenant_users")
    .select("tenant_id")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  return data?.tenant_id ?? null;
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = await getTenantId(user.id);
  if (!tenantId) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

  const admin = createAdminClient();
  const url = request.nextUrl;
  const status = url.searchParams.get("status");
  const sellerId = url.searchParams.get("seller_id");

  let query = admin
    .from("sales")
    .select("id, amount, commission_amt, status, customer_name, referral_code, notes, sale_date, seller_id, created_at")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (status) query = query.eq("status", status);
  if (sellerId) query = query.eq("seller_id", sellerId);

  const { data: sales, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  type SaleRow = { id: string; amount: unknown; commission_amt: unknown; status: string; customer_name: string | null; referral_code: string; notes: string | null; sale_date: string; seller_id: string; created_at: string };
  type ProfileRow = { id: string; full_name: string; referral_code: string };
  const salesArr = (sales ?? []) as SaleRow[];

  // Attach ambassador name from profiles
  const sellerIds = [...new Set(salesArr.map((s) => s.seller_id))];
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, full_name, referral_code")
    .in("id", sellerIds.length > 0 ? sellerIds : ["00000000-0000-0000-0000-000000000000"])
    .eq("tenant_id", tenantId);

  const profileMap = Object.fromEntries(((profiles ?? []) as ProfileRow[]).map((p: ProfileRow) => [p.id, p]));

  const rows = salesArr.map((s) => ({
    ...s,
    ambassador_name: profileMap[s.seller_id]?.full_name ?? "—",
  }));

  return NextResponse.json({ sales: rows });
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = await getTenantId(user.id);
  if (!tenantId) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

  const { id, status } = await request.json();
  const validStatuses = ["pending", "confirmed", "paid"];
  if (!id || !validStatuses.includes(status)) {
    return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("sales")
    .update({ status })
    .eq("id", id)
    .eq("tenant_id", tenantId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
