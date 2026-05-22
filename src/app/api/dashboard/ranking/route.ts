import { NextResponse } from "next/server";
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

  const [{ data: sales }, { data: profiles }] = await Promise.all([
    admin
      .from("sales")
      .select("seller_id, amount, commission_amt")
      .eq("tenant_id", tenantId),
    admin
      .from("profiles")
      .select("id, full_name, referral_code, avatar_url")
      .eq("tenant_id", tenantId)
      .eq("is_active", true),
  ]);

  type SaleRow = { seller_id: string; amount: unknown; commission_amt: unknown };
  type ProfileRow = { id: string; full_name: string; referral_code: string; avatar_url: string | null };
  const salesArr = (sales ?? []) as SaleRow[];

  const profilesArr = (profiles ?? []) as ProfileRow[];
  const ranking = profilesArr
    .map((p: ProfileRow) => {
      const own = salesArr.filter((s) => s.seller_id === p.id);
      const total_amount = own.reduce((acc, s) => acc + Number(s.amount), 0);
      const total_commission = own.reduce((acc, s) => acc + Number(s.commission_amt), 0);
      return {
        seller_id: p.id,
        full_name: p.full_name,
        referral_code: p.referral_code,
        avatar_url: p.avatar_url,
        sales_count: own.length,
        total_amount,
        total_commission,
      };
    })
    .sort((a, b) => b.total_amount - a.total_amount)
    .map((r, i) => ({ ...r, position: i + 1 }));

  return NextResponse.json({ ranking });
}
