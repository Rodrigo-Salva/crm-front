import { Sidebar, Navbar, AuthGuard } from "@/modules/shared";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex h-screen overflow-hidden bg-[var(--bg)] relative">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Navbar />
          <main className="flex-1 p-4 md:p-6 overflow-x-hidden overflow-y-auto">{children}</main>
        </div>
      </div>
    </AuthGuard>
  );
}
