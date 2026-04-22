import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string; code: string }> }
) {
  const { slug, code } = await params;
  const admin = createAdminClient();

  const { data: tenant } = await admin
    .from("tenants")
    .select("id, name, slug, primary_color, accent_color, logo_url, is_active")
    .eq("slug", slug)
    .maybeSingle();

  if (!tenant || !tenant.is_active) {
    return NextResponse.json({ error: "Tienda no encontrada" }, { status: 404 });
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("id, full_name, bio, avatar_url, referral_code, whatsapp_url, show_whatsapp, card_style, is_active")
    .eq("tenant_id", tenant.id)
    .eq("referral_code", code)
    .maybeSingle();

  if (!profile || !profile.is_active) {
    return NextResponse.json({ error: "Ficha no encontrada" }, { status: 404 });
  }

  return NextResponse.json({ tenant, profile });
}
