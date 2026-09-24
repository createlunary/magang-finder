import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { Rangka } from "@/components/layout/rangka";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",             // tab bar bawah menghormati area gestur Android/notch
  themeColor: [
    // Sama dengan --sidebar (warna bilah atas) di globals.css.
    { media: "(prefers-color-scheme: dark)", color: "#1a1913" },
    { media: "(prefers-color-scheme: light)", color: "#fbfaf5" },
  ],
};

export const metadata: Metadata = {
  title: "Magang Finder — Mission Control",
  description: "Pipeline pencarian magang otomatis: scraping, RAG, local LLM, dan ranking Claude.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className="min-h-screen">
        <Providers>
          <Rangka>{children}</Rangka>
        </Providers>
      </body>
    </html>
  );
}
