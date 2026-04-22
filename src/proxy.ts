import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "nexusstore.com";

// Resolve a custom domain (e.g. "tienda.com") to a tenant slug via Supabase REST.
// Returns null when no tenant matches or Supabase is not configured.
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
    // Root domain
  } else if (host.endsWith(`.${ROOT_DOMAIN}`)) {
    subdomain = host.slice(0, -(ROOT_DOMAIN.length + 1));
  } else if (host === "localhost" || host === "127.0.0.1") {
    const tenantParam = url.searchParams.get("tenant");
    subdomain = tenantParam ?? null;
  } else {
    // Possible custom domain — look up against DB
    customDomainSlug = await resolveCustomDomain(host);
  }

  // 2. Refresh session cookies (skip if Supabase not configured)
  const response = NextResponse.next();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (supabaseUrl && supabaseAnonKey && !supabaseUrl.includes("TU_PROYECTO")) {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    });
    await supabase.auth.getSession();
  }

  // 3. Forward identity via headers
  const effectiveSlug = customDomainSlug ?? subdomain;
  if (effectiveSlug) response.headers.set("x-tenant-slug", effectiveSlug);
  if (customDomainSlug) response.headers.set("x-tenant-host", host);

  // 4. Rewrites
  if (effectiveSlug === "admin") {
    url.pathname = `/admin${url.pathname}`;
    return NextResponse.rewrite(url, { headers: response.headers });
  }

  if (effectiveSlug && effectiveSlug !== "www") {
    url.pathname = `/t/${effectiveSlug}${url.pathname}`;
    return NextResponse.rewrite(url, { headers: response.headers });
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
