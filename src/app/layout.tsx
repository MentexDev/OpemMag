import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "NexusStore — Programa de embajadoras para tu tienda",
  description:
    "Lanza tu propio programa de afiliadas con tu marca, dominio y branding. Potenciado por NexusStore.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={poppins.variable} suppressHydrationWarning>
      <body className="min-h-full flex flex-col font-[family-name:var(--font-poppins)] antialiased">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
