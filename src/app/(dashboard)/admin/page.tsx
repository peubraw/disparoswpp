import { getAdminStats, getAdminUsers } from "@/actions/admin";
import Link from "next/link";
import { Users, Smartphone, Megaphone, Contact, MessageSquare } from "lucide-react";

export default async function AdminPage() {
  const [stats, users] = await Promise.all([getAdminStats(), getAdminUsers()]);

  const statCards = [
    { label: "Contas", value: stats.totalUsers, icon: Users, sub: null },
    {
      label: "Instâncias",
      value: stats.totalInstances,
      icon: Smartphone,
      sub: `${stats.connectedInstances} conectadas`,
    },
    { label: "Campanhas", value: stats.totalCampaigns, icon: Megaphone, sub: null },
    { label: "Contatos", value: stats.totalContacts, icon: Contact, sub: null },
    { label: "Mensagens", value: stats.totalMessages, icon: MessageSquare, sub: null },
  ];

  const statusLabel: Record<string, string> = {
    DRAFT: "Rascunho",
    SCHEDULED: "Agendada",
    RUNNING: "Rodando",
    PAUSED: "Pausada",
    COMPLETED: "Concluída",
    FAILED: "Falha",
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-widest text-[#25D366] drop-shadow-[0_0_10px_rgba(37,211,102,0.4)]">
          PAINEL ADMIN
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Visão geral do sistema</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {statCards.map(({ label, value, icon: Icon, sub }) => (
          <div
            key={label}
            className="bg-[#111a16] border border-[rgba(37,211,102,0.15)] rounded-lg p-4 flex flex-col gap-2"
          >
            <div className="flex items-center gap-2 text-[#25D366]">
              <Icon className="h-4 w-4" />
              <span className="font-heading text-xs tracking-widest uppercase">{label}</span>
            </div>
            <span className="text-3xl font-bold text-[#e8f5e9] font-heading">{value.toLocaleString("pt-BR")}</span>
            {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
          </div>
        ))}
      </div>

      {Object.keys(stats.campaignsByStatus).length > 0 && (
        <div className="bg-[#111a16] border border-[rgba(37,211,102,0.15)] rounded-lg p-4">
          <h2 className="font-heading text-xs tracking-widest text-[#25D366] uppercase mb-3">Campanhas por status</h2>
          <div className="flex flex-wrap gap-3">
            {Object.entries(stats.campaignsByStatus).map(([status, count]) => (
              <span
                key={status}
                className="text-xs bg-[rgba(37,211,102,0.07)] border border-[rgba(37,211,102,0.2)] rounded px-3 py-1 text-[#e8f5e9]"
              >
                {statusLabel[status] ?? status}: <strong>{count}</strong>
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="bg-[#111a16] border border-[rgba(37,211,102,0.15)] rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-[rgba(37,211,102,0.1)]">
          <h2 className="font-heading text-xs tracking-widest text-[#25D366] uppercase">Usuários</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-[rgba(37,211,102,0.04)]">
            <tr>
              {["Nome", "Email", "Role", "Instâncias", "Campanhas", "Listas", "Cadastro", ""].map((h) => (
                <th key={h} className="px-4 py-3 text-left font-heading text-xs text-[#25D366] uppercase tracking-widest">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-[rgba(37,211,102,0.08)] hover:bg-[rgba(37,211,102,0.04)] transition-colors">
                <td className="px-4 py-3 text-[#e8f5e9] font-medium">{u.name}</td>
                <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{u.email}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-heading tracking-widest px-2 py-0.5 rounded ${
                    u.role === "ADMIN"
                      ? "bg-[rgba(37,211,102,0.15)] text-[#25D366] border border-[rgba(37,211,102,0.3)]"
                      : "bg-[rgba(255,255,255,0.05)] text-muted-foreground"
                  }`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-center text-[#e8f5e9]">{u._count.waInstances}</td>
                <td className="px-4 py-3 text-center text-[#e8f5e9]">{u._count.campaigns}</td>
                <td className="px-4 py-3 text-center text-[#e8f5e9]">{u._count.contactLists}</td>
                <td className="px-4 py-3 text-muted-foreground text-xs">
                  {new Date(u.createdAt).toLocaleDateString("pt-BR")}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/usuarios/${u.id}`}
                    className="font-heading text-xs tracking-widest text-[#25D366] hover:text-[#7dffb3] transition-colors uppercase"
                  >
                    [ VER ]
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
