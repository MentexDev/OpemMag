import { decrypt } from "./crypto";

export interface ShopifyProduct {
  id: number;
  title: string;
  handle: string;
  status: string;
  vendor?: string;
  product_type?: string;
  tags?: string;
  images: { src: string; alt?: string | null }[];
  variants: { id: number; title: string; price: string; inventory_quantity?: number }[];
}

export interface TenantShopify {
  domain: string;
  encryptedToken: string;
}

export async function fetchTenantProducts(
  tenant: TenantShopify,
  opts: { limit?: number } = {}
): Promise<ShopifyProduct[]> {
  if (!tenant.domain || !tenant.encryptedToken) return [];

  let token: string;
  try {
    token = decrypt(tenant.encryptedToken);
  } catch (e) {
    console.error("Failed to decrypt shopify token", e);
    return [];
  }

  const limit = opts.limit ?? 250;
  const url = `https://${tenant.domain}/admin/api/2024-10/products.json?limit=${limit}&status=active`;
  const res = await fetch(url, {
    headers: {
      "X-Shopify-Access-Token": token,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    console.error("Shopify fetch failed", res.status, await res.text());
    return [];
  }

  const data = await res.json();
  return (data.products ?? []) as ShopifyProduct[];
}
