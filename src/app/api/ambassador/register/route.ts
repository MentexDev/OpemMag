import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function generateReferralCode(name: string): string {
  const prefix = name.toUpperCase().replace(/\s+/g, "").slice(0, 4).padEnd(4, "X");
  const year = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${year}-${rand}`;
}

export async function POST(request: NextRequest) {
  const { fullName, email, password, slug } = await request.json();

  if (!fullName || !email || !password || !slug) {
    return NextResponse.json({ error: "Todos los campos son requeridos." }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: tenant } = await admin
    .from("tenants")
    .select("id, is_active, require_approval")
    .eq("slug", slug)
    .maybeSingle();

  if (!tenant || !tenant.is_active) {
    return NextResponse.json({ error: "Programa de embajadoras no encontrado." }, { status: 404 });
  }

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
  const referralCode = generateReferralCode(fullName);
  const requiresApproval = tenant.require_approval === true;
  const memberStatus = requiresApproval ? "pending" : "approved";

  const { error: tuError } = await admin.from("tenant_users").insert({
    tenant_id: tenant.id,
    user_id: userId,
    role: "ambassador",
    status: memberStatus,
  });

  if (tuError) {
    await admin.auth.admin.deleteUser(userId);
    return NextResponse.json({ error: "Error al registrar embajadora." }, { status: 500 });
  }

  await admin.from("profiles").insert({
    id: userId,
    tenant_id: tenant.id,
    full_name: fullName,
    referral_code: referralCode,
    is_active: !requiresApproval,
  });

  return NextResponse.json({ ok: true, pending: requiresApproval });
}
