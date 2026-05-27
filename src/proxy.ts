import { NextRequest, NextResponse } from "next/server";

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "openmag.co";

// Resolve a custom domain to a tenant slug via Supabase REST.
// Uses direct fetch (Edge-compatible) instead of the Node.js Supabase client.
async function resolveCustomDomain(host: string): Promise<string | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRole || supabaseUrl.includes("TU_PROYECTO")) return null;

  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/tenants?select=slug&custom_domain=eq.${encodeURIComponent(host)}&is_active=eq.true&limit=1`,
      {
        headers: {
          apikey: serviceRole,
          Authorization: `Bearer ${serviceRole}`,
        },
      }
    );
    if (!res.ok) return null;
    const rows = (await res.json()) as { slug: string }[];
    return rows[0]?.slug ?? null;
  } catch {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const url = request.nextUrl.clone();
  const hostname = request.headers.get("host") ?? "";
  const host = hostname.replace(/:.*/, "");

  // 1. Determine subdomain or custom domain
  let subdomain: string | null = null;
  let customDomainSlug: string | null = null;

  if (host === ROOT_DOMAIN || host === `www.${ROOT_DOMAIN}`) {
    // Root domain — no rewrite needed
  } else if (host.endsWith(`.${ROOT_DOMAIN}`)) {
    subdomain = host.slice(0, -(ROOT_DOMAIN.length + 1));
  } else if (host === "localhost" || host === "127.0.0.1") {
    // Local dev: simulate subdomain with ?tenant=slug query param
    subdomain = url.searchParams.get("tenant") ?? null;
  } else {
    // Possible custom domain — look up against DB
    customDomainSlug = await resolveCustomDomain(host);
  }

  // 2. Build base response (session refresh happens in layouts via Supabase SSR)
  const response = NextResponse.next();

  // 3. Forward tenant identity via response headers
  const effectiveSlug = customDomainSlug ?? subdomain;
  if (effectiveSlug) response.headers.set("x-tenant-slug", effectiveSlug);
  if (customDomainSlug) response.headers.set("x-tenant-host", host);

  // 4. URL rewrites by subdomain — skip /api/ so client-side fetches aren't double-prefixed
  if (effectiveSlug === "admin") {
    if (!url.pathname.startsWith("/api/")) {
      url.pathname = `/admin${url.pathname}`;
    }
    return NextResponse.rewrite(url, { headers: response.headers });
  }

  if (effectiveSlug && effectiveSlug !== "www") {
    if (!url.pathname.startsWith("/api/")) {
      url.pathname = `/t/${effectiveSlug}${url.pathname}`;
    }
    return NextResponse.rewrite(url, { headers: response.headers });
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
