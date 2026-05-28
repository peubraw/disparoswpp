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
  Menu,
  ShieldCheck
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
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

export function Sidebar({ isAdmin }: { isAdmin?: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const items = [
    ...navItems,
    ...(isAdmin ? [{ href: "/admin", label: "Admin", icon: ShieldCheck }] : []),
  ];

  return (
    <>
      <aside className="hidden md:flex md:w-64 md:flex-col border-r border-[rgba(37,211,102,0.2)] bg-[#111a16] h-full shadow-[2px_0_20px_rgba(0,0,0,0.5)]">
        <SidebarHeader />
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <SidebarNavLinks pathname={pathname} items={items} onNavigate={() => setOpen(false)} />
        </div>
        <SidebarFooter />
      </aside>

      <div className="md:hidden flex items-center p-4 border-b border-[rgba(37,211,102,0.2)] bg-[#111a16] absolute top-0 left-0 w-full z-10">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger className="md:hidden flex items-center justify-center p-2 rounded-md text-whatsapp hover:bg-[rgba(37,211,102,0.1)] transition-colors">
            <Menu className="h-6 w-6" />
            <span className="sr-only">Toggle menu</span>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0 bg-[#111a16] border-r border-[rgba(37,211,102,0.2)]">
            <SheetTitle className="sr-only">Menu de Navegação</SheetTitle>
            <SidebarHeader />
            <div className="px-4 py-6 flex-1 overflow-y-auto">
              <SidebarNavLinks pathname={pathname} items={items} onNavigate={() => setOpen(false)} />
            </div>
            <SidebarFooter />
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}

function SidebarHeader() {
  return (
    <div className="flex h-16 items-center px-6 border-b border-[rgba(37,211,102,0.2)]">
      <div className="flex items-center gap-3 font-bold text-xl text-whatsapp font-heading tracking-wider drop-shadow-[0_0_8px_rgba(37,211,102,0.5)]">
        <MessageSquare className="h-6 w-6 animate-pulse-green" />
        <span>DISPAROS</span>
      </div>
    </div>
  );
}

function SidebarFooter() {
  return (
    <div className="flex items-center gap-3 px-6 py-4 border-t border-[rgba(37,211,102,0.2)] text-xs font-heading tracking-widest text-[#25D366]">
      <div className="h-2 w-2 rounded-full bg-[#25D366] animate-pulse-green shadow-[0_0_8px_#25D366]"></div>
      <span>SISTEMA ONLINE</span>
    </div>
  );
}

function SidebarNavLinks({
  pathname,
  items,
  onNavigate,
}: {
  pathname: string | null;
  items: { href: string; label: string; icon: React.ElementType }[];
  onNavigate: () => void;
}) {
  return (
    <nav className="space-y-2" data-testid="sidebar">
      {items.map((item) => {
        const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "group flex items-center gap-3 rounded-r-md px-3 py-3 text-sm font-medium transition-all duration-300 border-l-2",
              isActive
                ? "bg-[rgba(37,211,102,0.1)] text-[#25D366] border-[#25D366] shadow-[inset_4px_0_0_#25D366,0_0_10px_rgba(37,211,102,0.1)]"
                : "border-transparent text-muted-foreground hover:bg-[rgba(37,211,102,0.05)] hover:text-[#e8f5e9] hover:border-[rgba(37,211,102,0.3)]"
            )}
          >
            <Icon
              className={cn(
                "h-5 w-5 transition-transform duration-300",
                isActive ? "animate-pulse-green text-[#25D366]" : "group-hover:scale-110 group-hover:text-[#25D366]"
              )}
            />
            <span className={cn("tracking-wide", isActive && "drop-shadow-[0_0_5px_rgba(37,211,102,0.4)]")}>
              {item.label}
            </span>
            {item.href === "/inbox" && (
              <div className={cn(
                "[&>span]:!bg-transparent [&>span]:!text-[#25D366] [&>span]:!text-xs [&>span]:!font-heading [&>span]:drop-shadow-[0_0_5px_rgba(37,211,102,0.8)]",
                isActive && "[&>span]:drop-shadow-[0_0_8px_rgba(37,211,102,1)]"
              )}>
                <UnreadBadge />
              </div>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
