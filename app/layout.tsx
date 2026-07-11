import type { Metadata } from "next";
import JsonLd from "@/components/seo/JsonLd";
import { bakeryJsonLd } from "@/lib/seo";
import "./globals.css";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Open Door Bakery — Handmade pastries & celebration boxes in Hamilton",
    template: "%s | Open Door Bakery",
  },
  description:
    "Fresh handmade pastries, cakes, brownies, tarts and celebration boxes — baked with care in Hamilton, near Glasgow. Collection and local delivery across Hamilton, Motherwell, Bothwell, Blantyre & East Kilbride.",
  keywords: [
    "Hamilton bakery",
    "bakery Hamilton",
    "cakes Hamilton",
    "celebration cakes Hamilton",
    "pastries Hamilton",
    "bakery near me Hamilton",
    "Lanarkshire bakery",
    "cake delivery Hamilton",
  ],
  openGraph: {
    title: "Open Door Bakery — Hamilton",
    description:
      "Handmade pastries and celebration boxes, baked fresh in Hamilton. Collection & local delivery across Lanarkshire.",
    type: "website",
    url: SITE_URL,
    locale: "en_GB",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Mulish:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning>
        <JsonLd data={bakeryJsonLd()} />
        {children}
      </body>
    </html>
  );
}
