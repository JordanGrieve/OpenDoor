import DashboardNav from "@/components/dashboard/DashboardNav";

export const metadata = { title: "Dashboard" };

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", background: "var(--cream)", minHeight: "100vh" }}>
      <DashboardNav />
      <main style={{ flex: 1, padding: "32px 36px", maxWidth: 1200, minWidth: 0 }}>{children}</main>
    </div>
  );
}
