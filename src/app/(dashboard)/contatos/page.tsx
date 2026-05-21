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
        <h1 className="text-2xl font-bold text-gray-900">Listas de Contatos</h1>
        <Link
          href="/contatos/nova"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          + Nova Lista
        </Link>
      </div>

      {lists.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-lg">Nenhuma lista criada ainda.</p>
          <p className="text-sm mt-1">Crie sua primeira lista de contatos para começar.</p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Nome</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Contatos</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Criada em</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">Ações</th>
              </tr>
            </thead>
            <tbody>
              {lists.map((list) => (
                <tr key={list.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{list.name}</td>
                  <td className="px-4 py-3 text-gray-600">{list._count.contacts.toLocaleString("pt-BR")}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(list.createdAt).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <Link
                      href={`/contatos/${list.id}`}
                      className="text-blue-600 hover:underline text-sm"
                    >
                      Ver contatos
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
