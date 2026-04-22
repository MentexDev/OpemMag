import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";

export const dynamic = "force-dynamic";

async function guard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized", status: 401 as const };
  const allowed = await isSuperAdmin(user.id);
  if (!allowed) return { error: "Forbidden", status: 403 as const };
  return { user };
}

export async function GET() {
  const g = await guard();
  if ("error" in g) return NextResponse.json({ error: g.error }, { status: g.status });

  const admin = createAdminClient();
  const { data: tenants } = await admin
    .from("tenants")
    .select("id, name, slug, plan, is_active, created_at, owner_id, shopify_domain, primary_color, subscription_status, trial_ends_at, current_period_end")
    .order("created_at", { ascending: false });

  type Tenant = {
    id: string;
    name: string;
    slug: string;
    plan: string;
    is_active: boolean;
    created_at: string;
    owner_id: string;
    shopify_domain: string | null;
    primary_color: string;
    subscription_status: string;
    trial_ends_at: string;
    current_period_end: string | null;
  };
  const list = (tenants ?? []) as Tenant[];

  // Resolve owner emails + counts in parallel
  const enriched = await Promise.all(
    list.map(async (t) => {
      const [{ data: ownerUser }, { count: ambassadorsCount }, { count: salesCount }] = await Promise.all([
        admin.auth.admin.getUserById(t.owner_id),
        admin.from("tenant_users").select("*", { count: "exact", head: true }).eq("tenant_id", t.id).eq("role", "ambassador"),
        admin.from("sales").select("*", { count: "exact", head: true }).eq("tenant_id", t.id),
      ]);
      return {
        ...t,
        owner_email: ownerUser?.user?.email ?? "",
        ambassadors: ambassadorsCount ?? 0,
        sales: salesCount ?? 0,
      };
    })
  );

  return NextResponse.json({ tenants: enriched });
}

export async function PATCH(request: NextRequest) {
  const g = await guard();
  if ("error" in g) return NextResponse.json({ error: g.error }, { status: g.status });

  const { id, is_active, plan } = await request.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (is_active !== undefined) updates.is_active = is_active;
  if (plan !== undefined) updates.plan = plan;

  const admin = createAdminClient();
  const { error } = await admin.from("tenants").update(updates).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
