import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { AddContactButton } from "@/components/contacts/add-contact-button";
import { DeleteContactButton } from "@/components/contacts/delete-contact-button";
import { ValidateContactListNumbersButton } from "@/components/contacts/validate-contact-list-numbers-button";
import { ImportFromInstanceButton } from "@/components/contacts/import-from-instance-button";
import { WaInstanceStatus } from "@prisma/client";

const PAGE_SIZE = 50;

interface PageProps {
  params: Promise<{ listId: string }>;
  searchParams: Promise<{ page?: string }>;
}

export default async function ContactListPage({ params, searchParams }: PageProps) {
  const { listId } = await params;
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10));
  const skip = (page - 1) * PAGE_SIZE;

  const user = await getCurrentUser();

  const list = await prisma.contactList.findFirst({
    where: { id: listId, userId: user.id },
  });
  if (!list) notFound();

  const connectedInstances = await prisma.waInstance.findMany({
    where: { userId: user.id, status: WaInstanceStatus.CONNECTED },
    orderBy: { createdAt: "asc" },
    select: { instanceName: true },
  });

  const [contacts, total] = await Promise.all([
    prisma.contact.findMany({
      where: { contactListId: listId },
      skip,
      take: PAGE_SIZE,
      orderBy: { createdAt: "asc" },
    }),
    prisma.contact.count({ where: { contactListId: listId } }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/contatos" className="font-heading text-xs tracking-widest uppercase text-muted-foreground hover:text-[#e8f5e9] transition-colors">
            ← Listas
          </Link>
          <h1 className="text-2xl font-heading tracking-widest uppercase font-bold text-[#e8f5e9]">{list.name}</h1>
          <span className="text-sm text-muted-foreground">({total.toLocaleString("pt-BR")} contatos)</span>
        </div>
        <div className="flex items-center gap-3">
          <ImportFromInstanceButton listId={listId} instances={connectedInstances.map(i => i.instanceName)} />
          <ValidateContactListNumbersButton listId={listId} instanceName={connectedInstances[0]?.instanceName ?? null} />
          <AddContactButton listId={listId} />
        </div>
      </div>

      {contacts.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p>Nenhum contato nesta lista.</p>
          <Link href="/contatos/nova" className="font-heading text-xs tracking-widest uppercase text-[#25D366] hover:text-[#e8f5e9] hover:underline mt-2 inline-block">
            Importar contatos
          </Link>
        </div>
      ) : (
        <>
          <div className="border border-[rgba(37,211,102,0.15)] rounded-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[rgba(37,211,102,0.05)] border-b border-[rgba(37,211,102,0.15)]">
                <tr>
                  <th className="px-4 py-3 text-left font-heading text-xs text-[#25D366] uppercase tracking-widest">Telefone</th>
                  <th className="px-4 py-3 text-left font-heading text-xs text-[#25D366] uppercase tracking-widest">Nome</th>
                  <th className="px-4 py-3 text-left font-heading text-xs text-[#25D366] uppercase tracking-widest">Campos extras</th>
                  <th className="px-4 py-3 text-left font-heading text-xs text-[#25D366] uppercase tracking-widest">Adicionado em</th>
                  <th className="px-4 py-3 text-right font-heading text-xs text-[#25D366] uppercase tracking-widest">Ações</th>
                </tr>
              </thead>
              <tbody>
                {contacts.map((contact) => {
                  const custom =
                    contact.customFields &&
                    typeof contact.customFields === "object" &&
                    !Array.isArray(contact.customFields)
                      ? (contact.customFields as Record<string, string>)
                      : {};
                  const customEntries = Object.entries(custom).filter(([, v]) => v);
                  return (
                    <tr key={contact.id} className="border-t border-[rgba(37,211,102,0.08)] hover:bg-[rgba(37,211,102,0.04)] transition-colors">
                      <td className="px-4 py-3 font-mono text-[#e8f5e9]">{contact.phoneNumber}</td>
                      <td className="px-4 py-3 text-[#e8f5e9]">{contact.name ?? "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {customEntries.length > 0
                          ? customEntries.map(([k, v]) => `${k}: ${v}`).join(", ")
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(contact.createdAt).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <DeleteContactButton contactId={contact.id} listId={listId} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Página {page} de {totalPages}
              </p>
              <div className="flex gap-2">
                {page > 1 && (
                  <Link
                    href={`/contatos/${listId}?page=${page - 1}`}
                    className="font-heading text-xs tracking-widest uppercase border border-[rgba(37,211,102,0.15)] text-muted-foreground bg-transparent hover:border-[rgba(37,211,102,0.3)] hover:text-[#e8f5e9] rounded-sm px-3 py-1.5 transition-colors"
                  >
                    ← Anterior
                  </Link>
                )}
                {page < totalPages && (
                  <Link
                    href={`/contatos/${listId}?page=${page + 1}`}
                    className="font-heading text-xs tracking-widest uppercase border border-[rgba(37,211,102,0.15)] text-muted-foreground bg-transparent hover:border-[rgba(37,211,102,0.3)] hover:text-[#e8f5e9] rounded-sm px-3 py-1.5 transition-colors"
                  >
                    Próxima →
                  </Link>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
