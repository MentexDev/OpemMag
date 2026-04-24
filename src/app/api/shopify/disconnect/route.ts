import { NextResponse } from "next/server";
import { getCurrentTenantAdmin } from "@/lib/auth/current-tenant";
import { createAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST() {
  const ctx = await getCurrentTenantAdmin();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { error } = await admin
    .from("tenants")
    .update({
      shopify_domain: null,
      shopify_token: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", ctx.tenant.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
