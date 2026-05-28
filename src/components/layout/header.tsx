"use client";

import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LogOut, Terminal } from "lucide-react";

export function Header() {
  const pathname = usePathname();
  
  // Format pathname into a readable title
  const getPageTitle = () => {
    if (!pathname || pathname === "/") return "DASHBOARD";
    const path = pathname.split("/").filter(Boolean)[0];
    if (!path) return "DASHBOARD";
    return path.toUpperCase();
  };

  const handleLogout = () => {
    // Placeholder - will be wired in T5
    // TODO: implement logout
  };

  return (
    <header className="h-16 border-b border-[rgba(37,211,102,0.15)] bg-[#0a0f0d] flex items-center justify-between px-6 mt-[73px] md:mt-0 shadow-sm relative z-0">
      <div className="flex items-center gap-3">
        <Terminal className="h-5 w-5 text-[rgba(37,211,102,0.5)]" />
        <h1 className="text-sm font-heading font-bold text-muted-foreground uppercase tracking-widest drop-shadow-[0_0_2px_rgba(232,245,233,0.3)]">
          {`// SYS_NAV :: ${getPageTitle()}`}
        </h1>
      </div>
      
      <div className="flex items-center gap-6">
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-sm bg-[rgba(37,211,102,0.05)] border border-[rgba(37,211,102,0.1)]">
          <div className="h-1.5 w-1.5 rounded-full bg-[#25D366] animate-pulse-green shadow-[0_0_5px_#25D366]"></div>
          <span className="text-[10px] font-heading font-medium tracking-widest text-[#25D366]">
            SYS.ONLINE
          </span>
        </div>

        <button 
          onClick={handleLogout} 
          className="group flex items-center gap-2 text-xs font-heading font-bold text-muted-foreground hover:text-[#ef4444] transition-colors border border-[rgba(37,211,102,0.15)] hover:border-[#ef4444] px-3 py-1.5 rounded-sm bg-[#111a16]"
        >
          <span className="opacity-50 group-hover:opacity-100 transition-opacity">[</span>
          <LogOut className="h-3 w-3" />
          <span className="tracking-widest">SAIR</span>
          <span className="opacity-50 group-hover:opacity-100 transition-opacity">]</span>
        </button>
      </div>
    </header>
  );
}
