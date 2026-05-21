"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Smartphone,
  Megaphone,
  Users,
  MessageSquare,
  BarChart3,
  Menu
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";
import { UnreadBadge } from "@/components/inbox/unread-badge";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/instancias", label: "Instâncias", icon: Smartphone },
  { href: "/campanhas", label: "Campanhas", icon: Megaphone },
  { href: "/contatos", label: "Contatos", icon: Users },
  { href: "/inbox", label: "Inbox", icon: MessageSquare },
  { href: "/relatorios", label: "Relatórios", icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const NavLinks = () => (
    <nav className="space-y-1 mt-6" data-testid="sidebar">
      {navItems.map((item) => {
        const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
        const Icon = item.icon;
        
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isActive 
                ? "bg-whatsapp/10 text-whatsapp" 
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="h-5 w-5" />
            {item.label}
            {item.href === "/inbox" && <UnreadBadge />}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col border-r bg-card">
        <div className="flex h-16 items-center px-6 border-b">
          <div className="flex items-center gap-2 font-bold text-xl text-whatsapp">
            <MessageSquare className="h-6 w-6" />
            <span>DisparosWPP</span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <NavLinks />
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <div className="md:hidden flex items-center p-4 border-b bg-card absolute top-0 left-0 w-full z-10">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger className="md:hidden flex items-center justify-center p-2 rounded-md hover:bg-muted">
            
              <Menu className="h-6 w-6" />
              <span className="sr-only">Toggle menu</span>
            
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <div className="flex h-16 items-center px-6 border-b">
              <div className="flex items-center gap-2 font-bold text-xl text-whatsapp">
                <MessageSquare className="h-6 w-6" />
                <span>DisparosWPP</span>
              </div>
            </div>
            <div className="px-4 py-4">
              <NavLinks />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
