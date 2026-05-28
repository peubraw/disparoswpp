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

export async function addContact(listId: string, phoneNumber: string, name?: string) {
  const user = await getCurrentUser();

  const list = await prisma.contactList.findFirst({
    where: { id: listId, userId: user.id },
  });
  if (!list) return { error: "Lista não encontrada." };

  const digits = phoneNumber.replace(/\D/g, "");
  if (!digits) return { error: "Telefone inválido." };
  const cleaned = digits.length < 12 ? `55${digits}` : digits;

  const existing = await prisma.contact.findFirst({
    where: { contactListId: listId, phoneNumber: cleaned },
  });
  if (existing) return { error: "Contato já existe nesta lista." };

  const contact = await prisma.contact.create({
    data: { contactListId: listId, phoneNumber: cleaned, name: name?.trim() || null },
  });

  revalidatePath(`/contatos/${listId}`);
  return { success: true, contact };
}

export async function deleteContact(contactId: string, listId: string) {
  const user = await getCurrentUser();

  const list = await prisma.contactList.findFirst({
    where: { id: listId, userId: user.id },
  });
  if (!list) return { error: "Lista não encontrada." };

  await prisma.contact.delete({ where: { id: contactId, contactListId: listId } });
  revalidatePath(`/contatos/${listId}`);
  return { success: true };
}

