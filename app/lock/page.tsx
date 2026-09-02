import type { Metadata } from "next";
import LockScreen from "@/components/store/LockScreen";

export const metadata: Metadata = {
  title: "Coming soon",
  description: "Open Door Bakery — handmade pastries and celebration boxes in Hamilton. Opening soon.",
  // A holding page should never be the thing that ranks for the bakery.
  robots: { index: false, follow: false },
};

export default function LockPage() {
  return <LockScreen />;
}
