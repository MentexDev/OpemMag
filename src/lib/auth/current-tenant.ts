import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server";

export interface CurrentTenantContext {
  userId: string;
  email: string;
  tenant: {
    id: string;
    slug: string;
    name: string;
    plan: string;
    stripe_customer_id: string | null;
    stripe_subscription_id: string | null;
    subscription_status: string;
    trial_ends_at: string;
    current_period_end: string | null;
    cancel_at_period_end: boolean;
  };
}

/**
 * Returns the current logged-in tenant-admin's user + tenant.
 * Returns null if not authenticated or not a tenant admin.
 */
export async function getCurrentTenantAdmin(): Promise<CurrentTenantContext | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !user.email) return null;

  const admin = createAdminClient();
  const { data } = await admin
    .from("tenant_users")
    .select(
      "tenant_id, tenants(id, slug, name, plan, stripe_customer_id, stripe_subscription_id, subscription_status, trial_ends_at, current_period_end, cancel_at_period_end)"
    )
    .eq("user_id", user.id)
    .eq("role", "admin")
    .maybeSingle();

  if (!data?.tenants) return null;
  const tenant = Array.isArray(data.tenants) ? data.tenants[0] : data.tenants;
  return {
    userId: user.id,
    email: user.email,
    tenant: tenant as CurrentTenantContext["tenant"],
  };
}
