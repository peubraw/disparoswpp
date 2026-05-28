import type { ReactNode } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-[#0a0f0d] text-[#e8f5e9] selection:bg-[#25D366] selection:text-[#0a0f0d]">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(37,211,102,0.03)_0,transparent_100%)] pointer-events-none z-0"></div>
        <Header />
        <main className="flex-1 overflow-y-auto p-4 md:p-8 relative z-10 scrollbar-thin scrollbar-thumb-[rgba(37,211,102,0.2)] scrollbar-track-transparent">
          {children}
        </main>
      </div>
    </div>
  );
}
