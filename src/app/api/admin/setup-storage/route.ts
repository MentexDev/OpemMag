import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// One-time setup: creates the tenant-assets storage bucket
export async function POST() {
  const admin = createAdminClient();

  const { error } = await admin.storage.createBucket("tenant-assets", {
    public: true,
    fileSizeLimit: 2 * 1024 * 1024, // 2 MB
    allowedMimeTypes: ["image/png", "image/jpeg", "image/jpg", "image/svg+xml", "image/webp"],
  });

  if (error && !error.message.includes("already exists")) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, message: "Bucket tenant-assets ready" });
}
