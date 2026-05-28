import { getAdminUserDetail } from "@/actions/admin";
import { notFound } from "next/navigation";
import Link from "next/link";
import { DeleteUserButton } from "./delete-user-button";

const statusColor: Record<string, string> = {
  CONNECTED: "text-[#25D366]",
  CONNECTING: "text-yellow-400",
  DISCONNECTED: "text-muted-foreground",
};

const campaignStatusLabel: Record<string, string> = {
  DRAFT: "Rascunho",
  SCHEDULED: "Agendada",
  RUNNING: "Rodando",
  PAUSED: "Pausada",
  COMPLETED: "Concluída",
  FAILED: "Falha",
  CANCELLED: "Cancelada",
};

export default async function AdminUserDetailPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  const user = await getAdminUserDetail(userId);
  if (!user) notFound();

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href="/admin" className="text-xs text-muted-foreground hover:text-[#25D366] transition-colors font-heading tracking-widest uppercase">
            ← Admin
          </Link>
          <h1 className="font-heading text-2xl font-bold tracking-widest text-[#25D366] drop-shadow-[0_0_10px_rgba(37,211,102,0.4)] mt-1">
            {user.name.toUpperCase()}
          </h1>
          <p className="text-muted-foreground text-sm">{user.email}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Cadastrado em {new Date(user.createdAt).toLocaleDateString("pt-BR")} · Role:{" "}
            <span className={user.role === "ADMIN" ? "text-[#25D366]" : ""}>{user.role}</span>
          </p>
        </div>
        <DeleteUserButton userId={user.id} userName={user.name} />
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-[#111a16] border border-[rgba(37,211,102,0.15)] rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-[rgba(37,211,102,0.1)]">
            <h2 className="font-heading text-xs tracking-widest text-[#25D366] uppercase">
              Instâncias ({user.waInstances.length})
            </h2>
          </div>
          {user.waInstances.length === 0 ? (
            <p className="px-4 py-6 text-muted-foreground text-sm">Nenhuma instância.</p>
          ) : (
            <ul className="divide-y divide-[rgba(37,211,102,0.08)]">
              {user.waInstances.map((inst) => (
                <li key={inst.id} className="px-4 py-3">
                  <p className="text-[#e8f5e9] text-sm font-medium">{inst.instanceName}</p>
                  <p className="text-xs text-muted-foreground">{inst.phoneNumber ?? "—"}</p>
                  <p className={`text-xs font-heading tracking-widest uppercase mt-0.5 ${statusColor[inst.status] ?? ""}`}>
                    {inst.status}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-[#111a16] border border-[rgba(37,211,102,0.15)] rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-[rgba(37,211,102,0.1)]">
            <h2 className="font-heading text-xs tracking-widest text-[#25D366] uppercase">
              Listas de contatos ({user.contactLists.length})
            </h2>
          </div>
          {user.contactLists.length === 0 ? (
            <p className="px-4 py-6 text-muted-foreground text-sm">Nenhuma lista.</p>
          ) : (
            <ul className="divide-y divide-[rgba(37,211,102,0.08)]">
              {user.contactLists.map((list) => (
                <li key={list.id} className="px-4 py-3">
                  <p className="text-[#e8f5e9] text-sm font-medium">{list.name}</p>
                  <p className="text-xs text-muted-foreground">{list._count.contacts} contatos</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-[#111a16] border border-[rgba(37,211,102,0.15)] rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-[rgba(37,211,102,0.1)]">
            <h2 className="font-heading text-xs tracking-widest text-[#25D366] uppercase">
              Campanhas ({user.campaigns.length})
            </h2>
          </div>
          {user.campaigns.length === 0 ? (
            <p className="px-4 py-6 text-muted-foreground text-sm">Nenhuma campanha.</p>
          ) : (
            <ul className="divide-y divide-[rgba(37,211,102,0.08)]">
              {user.campaigns.map((c) => (
                <li key={c.id} className="px-4 py-3">
                  <p className="text-[#e8f5e9] text-sm font-medium">{c.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {campaignStatusLabel[c.status] ?? c.status} · {c.messages.length}/{c._count.messages} enviadas
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
