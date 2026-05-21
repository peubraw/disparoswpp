"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-utils";
import { revalidatePath } from "next/cache";

export async function createContactList(name: string) {
  const user = await getCurrentUser();
  const list = await prisma.contactList.create({
    data: { userId: user.id, name },
  });
  revalidatePath("/contatos");
  return { success: true, list };
}

export async function deleteContactList(listId: string) {
  const user = await getCurrentUser();

  const list = await prisma.contactList.findFirst({
    where: { id: listId, userId: user.id },
    include: { _count: { select: { campaignContactLists: true } } },
  });
  if (!list) return { error: "Lista não encontrada." };

  if (list._count.campaignContactLists > 0) {
    return { error: "Lista em uso por campanha ativa. Remova a lista das campanhas antes de excluir." };
  }

  await prisma.contactList.delete({ where: { id: listId } });
  revalidatePath("/contatos");
  return { success: true };
}

export async function getContactLists() {
  const user = await getCurrentUser();
  return prisma.contactList.findMany({
    where: { userId: user.id },
    include: { _count: { select: { contacts: true } } },
    orderBy: { createdAt: "desc" },
  });
}
