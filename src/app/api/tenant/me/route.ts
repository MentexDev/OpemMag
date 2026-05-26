import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data } = await admin
    .from("tenant_users")
    .select("tenant_id, tenants(id, name, slug, primary_color, accent_color, logo_url, shopify_domain, require_approval, commission_rate)")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .maybeSingle();

  if (!data) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

  const tenant = Array.isArray(data.tenants) ? data.tenants[0] : data.tenants;
  return NextResponse.json({ tenant });
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { name, primary_color, accent_color } = body;

  const admin = createAdminClient();

  const { data: tu } = await admin
    .from("tenant_users")
    .select("tenant_id")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .maybeSingle();

  if (!tu) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

  const { require_approval, commission_rate } = body;

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (name !== undefined) updates.name = name;
  if (primary_color !== undefined) updates.primary_color = primary_color;
  if (accent_color !== undefined) updates.accent_color = accent_color;
  if (require_approval !== undefined) updates.require_approval = require_approval;
  if (commission_rate !== undefined) {
    const rate = Number(commission_rate);
    if (!isNaN(rate) && rate >= 0 && rate <= 100) updates.commission_rate = rate;
  }

  const { error } = await admin
    .from("tenants")
    .update(updates)
    .eq("id", tu.tenant_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
