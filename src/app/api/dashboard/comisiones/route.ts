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

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = await getTenantId(user.id);
  if (!tenantId) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

  const admin = createAdminClient();

  const { data: sales, error } = await admin
    .from("sales")
    .select("seller_id, commission_amt, status")
    .eq("tenant_id", tenantId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: profiles } = await admin
    .from("profiles")
    .select("id, full_name, referral_code, avatar_url")
    .eq("tenant_id", tenantId)
    .eq("is_active", true);

  type SaleRow = { seller_id: string; commission_amt: unknown; status: string };
  const salesArr = (sales ?? []) as SaleRow[];

  type ProfileRow = { id: string; full_name: string; referral_code: string; avatar_url: string | null };
  const profilesArr = (profiles ?? []) as ProfileRow[];
  const summary = profilesArr.map((p: ProfileRow) => {
    const own = salesArr.filter((s) => s.seller_id === p.id);
    const total = own.reduce((acc, s) => acc + Number(s.commission_amt), 0);
    const pending = own
      .filter((s) => s.status === "pending" || s.status === "confirmed")
      .reduce((acc, s) => acc + Number(s.commission_amt), 0);
    const paid = own
      .filter((s) => s.status === "paid")
      .reduce((acc, s) => acc + Number(s.commission_amt), 0);
    const salesCount = own.length;
    return {
      seller_id: p.id,
      full_name: p.full_name,
      referral_code: p.referral_code,
      avatar_url: p.avatar_url,
      total_commission: total,
      pending_commission: pending,
      paid_commission: paid,
      sales_count: salesCount,
    };
  });

  return NextResponse.json({ commissions: summary });
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = await getTenantId(user.id);
  if (!tenantId) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

  const { seller_id } = await request.json();
  if (!seller_id) return NextResponse.json({ error: "seller_id requerido." }, { status: 400 });

  const admin = createAdminClient();

  // Mark all confirmed sales for this ambassador as paid
  const { error } = await admin
    .from("sales")
    .update({ status: "paid" })
    .eq("tenant_id", tenantId)
    .eq("seller_id", seller_id)
    .in("status", ["pending", "confirmed"]);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
