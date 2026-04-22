import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server";
import { addDomain, removeDomain, getDomain, verifyDomain, isVercelConfigured } from "@/lib/vercel";

export const dynamic = "force-dynamic";

async function getCurrentTenant() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const admin = createAdminClient();
  const { data } = await admin
    .from("tenant_users")
    .select("tenant_id, tenants(id, slug, custom_domain)")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .maybeSingle();

  if (!data) return null;
  const tenant = Array.isArray(data.tenants) ? data.tenants[0] : data.tenants;
  return tenant as { id: string; slug: string; custom_domain: string | null } | null;
}

const DOMAIN_REGEX = /^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;

export async function GET() {
  const tenant = await getCurrentTenant();
  if (!tenant) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!tenant.custom_domain) {
    return NextResponse.json({
      domain: null,
      vercelConfigured: isVercelConfigured(),
    });
  }

  const vercelDomain = await getDomain(tenant.custom_domain);
  return NextResponse.json({
    domain: tenant.custom_domain,
    verified: vercelDomain?.verified ?? false,
    verification: vercelDomain?.verification ?? [],
    vercelConfigured: isVercelConfigured(),
  });
}

export async function POST(request: NextRequest) {
  const tenant = await getCurrentTenant();
  if (!tenant) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { domain } = await request.json();
  if (!domain || !DOMAIN_REGEX.test(domain)) {
    return NextResponse.json({ error: "Dominio inválido. Ejemplo: tudominio.com" }, { status: 400 });
  }

  const normalized = domain.toLowerCase().replace(/^www\./, "");

  // Check uniqueness across tenants
  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("tenants")
    .select("id")
    .eq("custom_domain", normalized)
    .neq("id", tenant.id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: "Este dominio ya está en uso por otra tienda." }, { status: 409 });
  }

  // Add to Vercel (skip if not configured — local dev)
  if (isVercelConfigured()) {
    const result = await addDomain(normalized);
    if (!result.ok) {
      return NextResponse.json({ error: result.error ?? "Error al añadir dominio en Vercel." }, { status: 500 });
    }
  }

  // Save to DB
  const { error } = await admin
    .from("tenants")
    .update({ custom_domain: normalized, updated_at: new Date().toISOString() })
    .eq("id", tenant.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Get verification info to return
  const vercelDomain = isVercelConfigured() ? await getDomain(normalized) : null;
  return NextResponse.json({
    ok: true,
    domain: normalized,
    verified: vercelDomain?.verified ?? false,
    verification: vercelDomain?.verification ?? [],
  });
}

export async function DELETE() {
  const tenant = await getCurrentTenant();
  if (!tenant) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (tenant.custom_domain && isVercelConfigured()) {
    await removeDomain(tenant.custom_domain);
  }

  const admin = createAdminClient();
  await admin
    .from("tenants")
    .update({ custom_domain: null, updated_at: new Date().toISOString() })
    .eq("id", tenant.id);

  return NextResponse.json({ ok: true });
}

export async function PATCH() {
  // Trigger verification check
  const tenant = await getCurrentTenant();
  if (!tenant) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!tenant.custom_domain) return NextResponse.json({ error: "Sin dominio configurado" }, { status: 400 });
  if (!isVercelConfigured()) return NextResponse.json({ error: "Vercel no configurado" }, { status: 503 });

  const result = await verifyDomain(tenant.custom_domain);
  return NextResponse.json(result);
}
