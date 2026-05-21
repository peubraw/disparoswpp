import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

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
      <div className="flex items-center gap-3">
        <Link href="/contatos" className="text-gray-500 hover:text-gray-700 text-sm">
          ← Listas
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">{list.name}</h1>
        <span className="text-sm text-gray-500">({total.toLocaleString("pt-BR")} contatos)</span>
      </div>

      {contacts.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p>Nenhum contato nesta lista.</p>
          <Link href="/contatos/nova" className="text-blue-600 hover:underline text-sm mt-2 inline-block">
            Importar contatos
          </Link>
        </div>
      ) : (
        <>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Telefone</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Nome</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Campos extras</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Adicionado em</th>
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
                    <tr key={contact.id} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-gray-800">{contact.phoneNumber}</td>
                      <td className="px-4 py-3 text-gray-700">{contact.name ?? "—"}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {customEntries.length > 0
                          ? customEntries.map(([k, v]) => `${k}: ${v}`).join(", ")
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {new Date(contact.createdAt).toLocaleDateString("pt-BR")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Página {page} de {totalPages}
              </p>
              <div className="flex gap-2">
                {page > 1 && (
                  <Link
                    href={`/contatos/${listId}?page=${page - 1}`}
                    className="px-3 py-1.5 border border-gray-300 rounded text-sm hover:bg-gray-50 transition-colors"
                  >
                    ← Anterior
                  </Link>
                )}
                {page < totalPages && (
                  <Link
                    href={`/contatos/${listId}?page=${page + 1}`}
                    className="px-3 py-1.5 border border-gray-300 rounded text-sm hover:bg-gray-50 transition-colors"
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
