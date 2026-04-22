import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();

  const { data: tu } = await admin
    .from("tenant_users")
    .select("tenant_id")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .maybeSingle();

  if (!tu) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  const ext = file.name.split(".").pop() ?? "png";
  const path = `${tu.tenant_id}/logo.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await admin.storage
    .from("tenant-assets")
    .upload(path, buffer, {
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) {
    console.error("upload error", uploadError);
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: { publicUrl } } = admin.storage
    .from("tenant-assets")
    .getPublicUrl(path);

  await admin
    .from("tenants")
    .update({ logo_url: publicUrl, updated_at: new Date().toISOString() })
    .eq("id", tu.tenant_id);

  return NextResponse.json({ url: publicUrl });
}
