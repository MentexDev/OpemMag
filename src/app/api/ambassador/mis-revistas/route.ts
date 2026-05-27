import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function getAmbassadorContext(userId: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("tenant_users")
    .select("tenant_id, status")
    .eq("user_id", userId)
    .eq("role", "ambassador")
    .eq("status", "approved")
    .maybeSingle();
  return data ?? null;
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ctx = await getAmbassadorContext(user.id);
  if (!ctx) return NextResponse.json({ error: "Not ambassador" }, { status: 403 });

  const { name, product_ids } = await request.json() as { name: string; product_ids: string[] };
  if (!name?.trim() || !Array.isArray(product_ids) || product_ids.length === 0) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("ambassador_catalogs")
    .insert({ user_id: user.id, tenant_id: ctx.tenant_id, name: name.trim(), product_ids })
    .select("id, name, product_ids, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ catalog: data });
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const admin = createAdminClient();
  const { error } = await admin
    .from("ambassador_catalogs")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
