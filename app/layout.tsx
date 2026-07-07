import type { Metadata } from "next";
import "./globals.css";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Open Door Bakery — Handmade pastries & celebration boxes, Harrogate",
    template: "%s | Open Door Bakery",
  },
  description:
    "Fresh handmade pastries, cakes, brownies, tarts and celebration boxes — baked with care in Harrogate. Collection and local delivery available daily.",
  openGraph: {
    title: "Open Door Bakery",
    description:
      "Handmade pastries and celebration boxes, baked fresh in Harrogate. Collection & local delivery.",
    type: "website",
    url: SITE_URL,
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
      <body>{children}</body>
    </html>
  );
}
