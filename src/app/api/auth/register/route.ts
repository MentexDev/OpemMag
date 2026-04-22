import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const { storeName, slug, email, password } = await request.json();

  if (!storeName || !slug || !email || !password) {
    return NextResponse.json({ error: "Todos los campos son requeridos." }, { status: 400 });
  }

  const slugRegex = /^[a-z0-9-]{2,32}$/;
  if (!slugRegex.test(slug)) {
    return NextResponse.json(
      { error: "El slug solo puede contener letras minúsculas, números y guiones (2-32 caracteres)." },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  // Check slug availability
  const { data: existing } = await admin
    .from("tenants")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: "Ese nombre de tienda ya está en uso. Elige otro." },
      { status: 409 }
    );
  }

  // Create Supabase auth user
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError || !authData.user) {
    const msg = authError?.message ?? "Error al crear el usuario.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const userId = authData.user.id;

  // Create tenant
  const { data: tenant, error: tenantError } = await admin
    .from("tenants")
    .insert({
      slug,
      name: storeName,
      owner_id: userId,
      plan: "starter",
      primary_color: "#6366f1",
      accent_color: "#a5b4fc",
    })
    .select("id")
    .single();

  if (tenantError || !tenant) {
    // Rollback auth user
    await admin.auth.admin.deleteUser(userId);
    console.error("tenantError", tenantError);
    return NextResponse.json({ error: "Error al crear la tienda." }, { status: 500 });
  }

  // Create tenant_users entry linking owner to tenant
  const { error: memberError } = await admin.from("tenant_users").insert({
    tenant_id: tenant.id,
    user_id: userId,
    role: "admin",
  });

  if (memberError) {
    console.error("memberError", memberError);
    // Non-fatal: tenant is created, log and continue
  }

  return NextResponse.json({ ok: true, tenantId: tenant.id, slug });
}
