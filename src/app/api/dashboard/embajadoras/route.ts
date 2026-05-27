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

  // Query 1: ambassador memberships
  const { data: members } = await admin
    .from("tenant_users")
    .select("user_id, created_at, status, commission_rate")
    .eq("tenant_id", tenantId)
    .eq("role", "ambassador")
    .order("created_at", { ascending: false });

  if (!members || members.length === 0) {
    return NextResponse.json({ ambassadors: [] });
  }

  type MemberRow = { user_id: string; created_at: string; status: string; commission_rate: number | null };
  const membersArr = members as MemberRow[];
  const userIds = membersArr.map((m) => m.user_id);

  // Query 2: profiles for those users
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, full_name, referral_code, is_active, avatar_url, phone, city")
    .eq("tenant_id", tenantId)
    .in("id", userIds);

  type ProfileRow = {
    id: string;
    full_name?: string;
    referral_code?: string;
    is_active?: boolean;
    avatar_url?: string | null;
    phone?: string;
    city?: string;
  };
  const profileMap = Object.fromEntries(
    ((profiles ?? []) as ProfileRow[]).map((p) => [p.id, p])
  );

  // Query 3: emails via admin auth
  const emailMap: Record<string, string> = {};
  for (const uid of userIds) {
    const { data: u } = await admin.auth.admin.getUserById(uid);
    if (u?.user?.email) emailMap[uid] = u.user.email;
  }

  const ambassadors = membersArr.map((m) => {
    const p = profileMap[m.user_id];
    return {
      user_id: m.user_id,
      status: m.status ?? "approved",
      email: emailMap[m.user_id] ?? "",
      full_name: p?.full_name ?? "",
      referral_code: p?.referral_code ?? "",
      is_active: p?.is_active ?? true,
      phone: p?.phone ?? "",
      city: p?.city ?? "",
      joined_at: m.created_at,
      commission_rate: m.commission_rate ?? null,
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

  const body = await request.json();
  const admin = createAdminClient();

  // Update commission_rate on tenant_users
  if (body.commission_rate !== undefined) {
    const rate = body.commission_rate === null ? null : Number(body.commission_rate);
    const { error } = await admin
      .from("tenant_users")
      .update({ commission_rate: rate })
      .eq("tenant_id", tenantId)
      .eq("user_id", body.user_id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  // Update is_active on profiles
  const { error } = await admin
    .from("profiles")
    .update({ is_active: body.is_active })
    .eq("id", body.user_id)
    .eq("tenant_id", tenantId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = await getTenantId(user.id);
  if (!tenantId) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

  const { user_id } = await request.json();
  if (!user_id) return NextResponse.json({ error: "Falta user_id" }, { status: 400 });

  const admin = createAdminClient();

  // Remove from tenant_users (removes them from the program)
  const { error: tuError } = await admin
    .from("tenant_users")
    .delete()
    .eq("tenant_id", tenantId)
    .eq("user_id", user_id);

  if (tuError) return NextResponse.json({ error: tuError.message }, { status: 500 });

  // Deactivate profile for this tenant
  await admin
    .from("profiles")
    .update({ is_active: false })
    .eq("id", user_id)
    .eq("tenant_id", tenantId);

  return NextResponse.json({ ok: true });
}
