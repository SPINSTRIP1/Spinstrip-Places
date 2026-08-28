import type { Metadata, Viewport } from "next";
import "./globals.css";
import { QueryProvider } from "@/lib/query-provider";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  ),
  title: {
    default: "SpinStrip Places — Discover What Moves You",
    template: "%s — SpinStrip Places",
  },
  description:
    "Explore vibrant places, unforgettable events and the menus people love — listed by the small businesses around you, all in one platform.",
};

export const viewport: Viewport = {
  themeColor: "#f8f8f8",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="font-sf-pro antialiased">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
