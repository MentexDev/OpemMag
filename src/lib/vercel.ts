// Vercel Domains API client
// Docs: https://vercel.com/docs/rest-api/reference/endpoints/projects/add-a-domain-to-a-project

const VERCEL_API = "https://api.vercel.com";

function getAuth() {
  const token = process.env.VERCEL_TOKEN;
  const projectId = process.env.VERCEL_PROJECT_ID;
  const teamId = process.env.VERCEL_TEAM_ID;
  if (!token || !projectId) return null;
  return { token, projectId, teamId };
}

function buildUrl(path: string): string {
  const auth = getAuth();
  if (!auth) throw new Error("Vercel no configurado");
  const teamQuery = auth.teamId ? `?teamId=${auth.teamId}` : "";
  return `${VERCEL_API}${path}${teamQuery}`;
}

function headers(): HeadersInit {
  const auth = getAuth();
  if (!auth) throw new Error("Vercel no configurado");
  return {
    Authorization: `Bearer ${auth.token}`,
    "Content-Type": "application/json",
  };
}

export interface VercelDomain {
  name: string;
  apexName: string;
  verified: boolean;
  verification?: { type: string; domain: string; value: string; reason?: string }[];
}

export function isVercelConfigured(): boolean {
  return getAuth() !== null;
}

export async function addDomain(domain: string): Promise<{ ok: boolean; error?: string }> {
  const auth = getAuth();
  if (!auth) return { ok: false, error: "Vercel no está configurado en el servidor." };

  const res = await fetch(buildUrl(`/v10/projects/${auth.projectId}/domains`), {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ name: domain }),
  });

  if (res.ok) return { ok: true };

  const data = await res.json().catch(() => ({}));
  // Already exists is a "soft" success — we treat it as ok
  if (data?.error?.code === "domain_already_in_use" || data?.error?.code === "domain_already_added") {
    return { ok: true };
  }
  return { ok: false, error: data?.error?.message ?? `HTTP ${res.status}` };
}

export async function removeDomain(domain: string): Promise<{ ok: boolean; error?: string }> {
  const auth = getAuth();
  if (!auth) return { ok: false, error: "Vercel no está configurado en el servidor." };

  const res = await fetch(buildUrl(`/v9/projects/${auth.projectId}/domains/${domain}`), {
    method: "DELETE",
    headers: headers(),
  });

  if (res.ok || res.status === 404) return { ok: true };
  const data = await res.json().catch(() => ({}));
  return { ok: false, error: data?.error?.message ?? `HTTP ${res.status}` };
}

export async function getDomain(domain: string): Promise<VercelDomain | null> {
  const auth = getAuth();
  if (!auth) return null;

  const res = await fetch(buildUrl(`/v9/projects/${auth.projectId}/domains/${domain}`), {
    headers: headers(),
    cache: "no-store",
  });

  if (!res.ok) return null;
  return await res.json();
}

export async function verifyDomain(domain: string): Promise<{ verified: boolean; reason?: string }> {
  const auth = getAuth();
  if (!auth) return { verified: false, reason: "Vercel no configurado" };

  const res = await fetch(
    buildUrl(`/v9/projects/${auth.projectId}/domains/${domain}/verify`),
    { method: "POST", headers: headers() }
  );

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    return { verified: false, reason: data?.error?.message ?? `HTTP ${res.status}` };
  }
  const data = await res.json();
  return { verified: !!data?.verified };
}
