import { notFound } from "next/navigation";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/server";
import { MessageCircle, BookOpen } from "lucide-react";

export const dynamic = "force-dynamic";

interface CardStyle {
  bgColor?: string;
  textColor?: string;
  accentColor?: string;
  avatarShape?: "circle" | "square" | "rounded";
  borderColor?: string;
}

async function loadData(slug: string, code: string) {
  const admin = createAdminClient();
  const { data: tenant } = await admin
    .from("tenants")
    .select("id, name, slug, primary_color, accent_color, logo_url, is_active")
    .eq("slug", slug)
    .maybeSingle();
  if (!tenant || !tenant.is_active) return null;

  const { data: profile } = await admin
    .from("profiles")
    .select("id, full_name, bio, avatar_url, referral_code, whatsapp_url, show_whatsapp, card_style, is_active")
    .eq("tenant_id", tenant.id)
    .eq("referral_code", code)
    .maybeSingle();
  if (!profile || !profile.is_active) return null;

  return { tenant, profile };
}

export default async function PublicCardPage({
  params,
}: {
  params: Promise<{ slug: string; code: string }>;
}) {
  const { slug, code } = await params;
  const data = await loadData(slug, code);
  if (!data) notFound();

  const { tenant, profile } = data;
  const style: CardStyle = (profile.card_style as CardStyle) ?? {};

  const bgColor = style.bgColor ?? "#0a0a0a";
  const textColor = style.textColor ?? "#ffffff";
  const accentColor = style.accentColor ?? tenant.primary_color;
  const avatarShape = style.avatarShape ?? "circle";
  const borderColor = style.borderColor ?? "transparent";

  const avatarRadius =
    avatarShape === "circle" ? "9999px" : avatarShape === "rounded" ? "20px" : "0px";

  const revistaUrl = `/t/${slug}/ver?ref=${profile.referral_code}`;

  return (
    <div
      className="min-h-screen flex flex-col items-center px-4 py-12"
      style={{ backgroundColor: bgColor, color: textColor }}
    >
      <div className="w-full max-w-sm mx-auto space-y-6">
        {/* Logo del tenant */}
        <div className="flex justify-center">
          {tenant.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={tenant.logo_url} alt={tenant.name} className="h-8 w-auto object-contain opacity-80" />
          ) : (
            <span className="text-sm font-medium opacity-60">{tenant.name}</span>
          )}
        </div>

        {/* Avatar */}
        <div className="flex justify-center">
          <div
            className="h-28 w-28 overflow-hidden flex items-center justify-center text-3xl font-bold"
            style={{
              borderRadius: avatarRadius,
              border: `3px solid ${borderColor}`,
              backgroundColor: accentColor + "20",
            }}
          >
            {profile.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatar_url}
                alt={profile.full_name ?? ""}
                className="h-full w-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span style={{ color: accentColor }}>
                {profile.full_name?.[0]?.toUpperCase() ?? "?"}
              </span>
            )}
          </div>
        </div>

        {/* Nombre + bio */}
        <div className="text-center space-y-1">
          <h1 className="text-xl font-bold">{profile.full_name}</h1>
          {profile.bio && (
            <p className="text-sm opacity-70 leading-relaxed">{profile.bio}</p>
          )}
          <p className="text-xs opacity-50 font-mono pt-1">
            Embajadora de {tenant.name}
          </p>
        </div>

        {/* Botones */}
        <div className="space-y-2.5">
          <Link
            href={revistaUrl}
            className="flex items-center justify-center gap-2 w-full rounded-2xl py-3.5 font-semibold transition-transform active:scale-[0.98]"
            style={{ backgroundColor: accentColor, color: "#fff" }}
          >
            <BookOpen className="h-4 w-4" />
            Ver mi revista
          </Link>

          {profile.show_whatsapp && profile.whatsapp_url && (
            <a
              href={profile.whatsapp_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full rounded-2xl py-3.5 font-semibold transition-transform active:scale-[0.98] border-2"
              style={{ borderColor: accentColor, color: textColor }}
            >
              <MessageCircle className="h-4 w-4" />
              Escríbeme por WhatsApp
            </a>
          )}
        </div>

        {/* Footer */}
        <div className="pt-8 text-center">
          <p className="text-[10px] opacity-40">
            Powered by <span className="font-semibold">NexusStore</span>
          </p>
        </div>
      </div>
    </div>
  );
}
