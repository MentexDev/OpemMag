import { decrypt } from "./crypto";

export function shopifyImageUrl(src: string, width: number, height?: number): string {
  if (!src) return src;
  const [base, params] = src.split("?");
  const lastDot = base.lastIndexOf(".");
  if (lastDot === -1) return src;
  const size = height ? `_${width}x${height}` : `_${width}x`;
  const sized = base.substring(0, lastDot) + size + base.substring(lastDot);
  const query = params ? `?${params}&format=webp` : "?format=webp";
  return sized + query;
}

export interface ShopifyProduct {
  id: number;
  title: string;
  handle: string;
  status: string;
  vendor?: string;
  product_type?: string;
  tags?: string;
  body_html?: string;
  created_at?: string;
  updated_at?: string;
  images: { id?: number; src: string; alt?: string | null }[];
  variants: {
    id: number;
    title: string;
    price: string;
    compare_at_price?: string | null;
    sku?: string;
    inventory_quantity?: number;
    option1?: string | null;
    option2?: string | null;
  }[];
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
