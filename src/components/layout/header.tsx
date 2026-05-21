"use client";

import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export function Header() {
  const pathname = usePathname();
  
  // Format pathname into a readable title
  const getPageTitle = () => {
    if (!pathname || pathname === "/") return "Dashboard";
    const path = pathname.split("/").filter(Boolean)[0];
    if (!path) return "Dashboard";
    return path.charAt(0).toUpperCase() + path.slice(1);
  };

  const handleLogout = () => {
    // Placeholder - will be wired in T5
    // TODO: implement logout
  };

  return (
    <header className="h-16 border-b bg-card flex items-center justify-between px-6 mt-16 md:mt-0">
      <h1 className="text-xl font-semibold text-foreground">
        {getPageTitle()}
      </h1>
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-foreground">
          <LogOut className="h-4 w-4 mr-2" />
          Sair
        </Button>
      </div>
    </header>
  );
}
