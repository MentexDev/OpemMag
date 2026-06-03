import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server";
import DashboardClient from "./client";

export const dynamic = "force-dynamic";

export default async function AmbassadorDashboardPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();

  const { data: tenant } = await admin
    .from("tenants")
    .select("id, name, primary_color")
    .eq("slug", slug)
    .maybeSingle();

  if (!tenant) redirect("/login");

  const { data: profile } = await admin
    .from("profiles")
    .select("full_name, referral_code")
    .eq("id", user.id)
    .eq("tenant_id", tenant.id)
    .maybeSingle();

  const { data: sales } = await admin
    .from("sales")
    .select("amount, commission_amt, status")
    .eq("tenant_id", tenant.id)
    .eq("seller_id", user.id);

  type Sale = { amount: unknown; commission_amt: unknown; status: string };
  const salesArr = (sales ?? []) as Sale[];
  const totalSales = salesArr.reduce((s, r) => s + Number(r.amount), 0);
  const totalComm = salesArr.reduce((s, r) => s + Number(r.commission_amt), 0);
  const pendingComm = salesArr
    .filter((r) => r.status === "pending")
    .reduce((s, r) => s + Number(r.commission_amt), 0);

  return (
    <DashboardClient
      slug={slug}
      primaryColor={(tenant as { primary_color: string }).primary_color}
      refCode={profile?.referral_code ?? null}
      salesStats={{ totalSales, totalComm, pendingComm }}
    />
  );
}
