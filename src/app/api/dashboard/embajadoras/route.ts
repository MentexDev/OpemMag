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
  const { data } = await admin
    .from("tenant_users")
    .select("user_id, created_at, profiles(full_name, referral_code, is_active, avatar_url, phone, city)")
    .eq("tenant_id", tenantId)
    .eq("role", "ambassador")
    .order("created_at", { ascending: false });

  type Row = {
    user_id: string;
    created_at: string;
    profiles: { full_name?: string; referral_code?: string; is_active?: boolean; phone?: string; city?: string } | { full_name?: string; referral_code?: string; is_active?: boolean; phone?: string; city?: string }[] | null;
  };
  const rows = (data ?? []) as Row[];

  // Get emails from auth.users via admin
  const userIds = rows.map((r: Row) => r.user_id);
  const emailMap: Record<string, string> = {};
  for (const uid of userIds) {
    const { data: u } = await admin.auth.admin.getUserById(uid);
    if (u?.user?.email) emailMap[uid] = u.user.email;
  }

  const ambassadors = rows.map((r: Row) => {
    const profile = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles;
    return {
      user_id: r.user_id,
      email: emailMap[r.user_id] ?? "",
      full_name: profile?.full_name ?? "",
      referral_code: profile?.referral_code ?? "",
      is_active: profile?.is_active ?? true,
      phone: profile?.phone ?? "",
      city: profile?.city ?? "",
      joined_at: r.created_at,
    };
  });

  return NextResponse.json({ ambassadors });
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = await getTenantId(user.id);
  if (!tenantId) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

  const { user_id, is_active } = await request.json();
  const admin = createAdminClient();

  const { error } = await admin
    .from("profiles")
    .update({ is_active })
    .eq("id", user_id)
    .eq("tenant_id", tenantId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
