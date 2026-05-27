import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server";
import { sendAmbassadorApproved, sendAmbassadorRejected } from "@/lib/email";

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

  // Query 1: memberships
  const { data: members, error } = await admin
    .from("tenant_users")
    .select("user_id, status, created_at")
    .eq("tenant_id", tenantId)
    .eq("role", "ambassador")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (!members || members.length === 0) {
    return NextResponse.json({ ambassadors: [], pending: 0 });
  }

  type MemberRow = { user_id: string; status: string; created_at: string };
  const membersArr = members as MemberRow[];
  const userIds = membersArr.map((m) => m.user_id);

  // Query 2: profiles
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, full_name, referral_code, avatar_url, city, phone")
    .eq("tenant_id", tenantId)
    .in("id", userIds);

  type ProfileRow = {
    id: string;
    full_name?: string;
    referral_code?: string;
    avatar_url?: string | null;
    city?: string;
    phone?: string;
  };
  const profileMap = Object.fromEntries(
    ((profiles ?? []) as ProfileRow[]).map((p) => [p.id, p])
  );

  // Query 3: emails
  const emailMap: Record<string, string> = {};
  for (const uid of userIds) {
    const { data: u } = await admin.auth.admin.getUserById(uid);
    if (u?.user?.email) emailMap[uid] = u.user.email;
  }

  const ambassadors = membersArr.map((m) => {
    const p = profileMap[m.user_id];
    return {
      user_id: m.user_id,
      status: m.status,
      created_at: m.created_at,
      email: emailMap[m.user_id] ?? "",
      full_name: p?.full_name ?? "",
      referral_code: p?.referral_code ?? "",
      city: p?.city ?? "",
      phone: p?.phone ?? "",
    };
  });

  const pending = ambassadors.filter((a) => a.status === "pending").length;

  return NextResponse.json({ ambassadors, pending });
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = await getTenantId(user.id);
  if (!tenantId) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

  const { user_id, action } = await request.json();
  if (!user_id || !["approve", "reject"].includes(action)) {
    return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });
  }

  const admin = createAdminClient();
  const newStatus = action === "approve" ? "approved" : "rejected";

  const { error: tuError } = await admin
    .from("tenant_users")
    .update({ status: newStatus })
    .eq("tenant_id", tenantId)
    .eq("user_id", user_id);

  if (tuError) return NextResponse.json({ error: tuError.message }, { status: 500 });

  const { error: pError } = await admin
    .from("profiles")
    .update({ is_active: action === "approve" })
    .eq("id", user_id)
    .eq("tenant_id", tenantId);

  if (pError) return NextResponse.json({ error: pError.message }, { status: 500 });

  // Send email notification (fire-and-forget, don't block response)
  try {
    const [{ data: authUser }, { data: profile }, { data: tenant }] = await Promise.all([
      admin.auth.admin.getUserById(user_id),
      admin.from("profiles").select("full_name").eq("id", user_id).eq("tenant_id", tenantId).maybeSingle(),
      admin.from("tenants").select("name, slug").eq("id", tenantId).maybeSingle(),
    ]);

    const email = authUser?.user?.email;
    const name = (profile as { full_name?: string } | null)?.full_name ?? "Embajadora";
    const tenantName = (tenant as { name?: string; slug?: string } | null)?.name ?? "";
    const tenantSlug = (tenant as { name?: string; slug?: string } | null)?.slug ?? "";

    if (email && tenantName) {
      if (action === "approve") {
        await sendAmbassadorApproved({ to: email, ambassadorName: name, tenantName, tenantSlug });
      } else {
        await sendAmbassadorRejected({ to: email, ambassadorName: name, tenantName });
      }
    }
  } catch {
    // Email failure doesn't affect the approval action
  }

  return NextResponse.json({ ok: true });
}
