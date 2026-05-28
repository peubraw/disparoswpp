import Link from "next/link";
import { getCurrentUser } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { DeleteListButton } from "@/components/contacts/delete-list-button";

export default async function ContatosPage() {
  const user = await getCurrentUser();
  const lists = await prisma.contactList.findMany({
    where: { userId: user.id },
    include: { _count: { select: { contacts: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-heading font-bold text-[#e8f5e9] uppercase tracking-widest">
          Listas de Contatos
        </h1>
        <Link
          href="/contatos/nova"
          className="font-heading text-xs font-bold tracking-widest uppercase px-4 py-2 rounded-sm border border-[rgba(37,211,102,0.4)] text-[#25D366] bg-[rgba(37,211,102,0.08)] hover:bg-[rgba(37,211,102,0.15)] transition-all"
        >
          [ + NOVA LISTA ]
        </Link>
      </div>

      {lists.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-[rgba(37,211,102,0.2)] rounded-xl">
          <p className="text-[#e8f5e9] font-heading text-sm tracking-widest">NENHUMA LISTA CRIADA</p>
          <p className="text-muted-foreground text-xs mt-2">Crie sua primeira lista de contatos para começar.</p>
        </div>
      ) : (
        <div className="border border-[rgba(37,211,102,0.15)] rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[rgba(37,211,102,0.05)] border-b border-[rgba(37,211,102,0.15)]">
              <tr>
                <th className="px-4 py-3 text-left font-heading text-xs font-bold text-[#25D366] uppercase tracking-widest">Nome</th>
                <th className="px-4 py-3 text-left font-heading text-xs font-bold text-[#25D366] uppercase tracking-widest">Contatos</th>
                <th className="px-4 py-3 text-left font-heading text-xs font-bold text-[#25D366] uppercase tracking-widest">Criada em</th>
                <th className="px-4 py-3 text-right font-heading text-xs font-bold text-[#25D366] uppercase tracking-widest">Ações</th>
              </tr>
            </thead>
            <tbody>
              {lists.map((list) => (
                <tr key={list.id} className="border-t border-[rgba(37,211,102,0.08)] hover:bg-[rgba(37,211,102,0.04)] transition-colors">
                  <td className="px-4 py-3 font-medium text-[#e8f5e9]">{list.name}</td>
                  <td className="px-4 py-3 font-mono text-[rgba(37,211,102,0.7)]">{list._count.contacts.toLocaleString("pt-BR")}</td>
                  <td className="px-4 py-3 text-muted-foreground font-mono text-xs">
                    {new Date(list.createdAt).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="px-4 py-3 text-right space-x-3">
                    <Link
                      href={`/contatos/${list.id}`}
                      className="font-heading text-xs font-bold tracking-widest text-[#25D366] hover:text-[#e8f5e9] transition-colors uppercase"
                    >
                      [ VER ]
                    </Link>
                    <DeleteListButton listId={list.id} listName={list.name} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
