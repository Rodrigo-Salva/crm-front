import { Sidebar, Navbar, AuthGuard } from "@/modules/shared";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex h-full">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Navbar />
          <main className="flex-1 p-6 overflow-auto bg-[var(--bg)]">{children}</main>
        </div>
      </div>
    </AuthGuard>
  );
}
