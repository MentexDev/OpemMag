import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/server";
import RevistaClient from "./client";

export const dynamic = "force-dynamic";

interface SearchParams {
  ids?: string;
  ref?: string;
  all?: string;
}

async function getTenant(slug: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("tenants")
    .select("id, name, slug, primary_color, accent_color, logo_url, is_active, shopify_domain")
    .eq("slug", slug)
    .maybeSingle();
  return data && data.is_active ? data : null;
}

export default async function RevistaPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { slug } = await params;
  const sp = await searchParams;

  const tenant = await getTenant(slug);
  if (!tenant) notFound();

  const ids = sp.ids ?? null;
  const ref = sp.ref ?? null;

  return <RevistaClient tenant={tenant} ids={ids} refCode={ref} />;
}
