"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-utils";
import { evolutionClient } from "@/lib/evolution-client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

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

const importGroupsSchema = z.object({
  listId: z.string().min(1),
  instanceName: z.string().min(1),
});

export async function importGroupsFromInstance(listId: string, instanceName: string) {
  const user = await getCurrentUser();

  const parsed = importGroupsSchema.safeParse({ listId, instanceName });
  if (!parsed.success) return { error: "Dados inválidos." };

  const list = await prisma.contactList.findFirst({
    where: { id: parsed.data.listId, userId: user.id },
  });
  if (!list) return { error: "Lista não encontrada." };

  let groups: Array<{ id: string; subject: string }>;
  try {
    groups = await evolutionClient.fetchGroups(parsed.data.instanceName);
  } catch {
    return { error: "Não foi possível buscar grupos. Verifique se a instância está conectada." };
  }

  if (groups.length === 0) return { imported: 0, total: 0 };

  let imported = 0;
  for (const group of groups) {
    if (!group.id) continue;
    try {
      await prisma.contact.upsert({
        where: { contactListId_phoneNumber: { contactListId: parsed.data.listId, phoneNumber: group.id } },
        update: group.subject ? { name: group.subject } : {},
        create: { contactListId: parsed.data.listId, phoneNumber: group.id, name: group.subject || null },
      });
      imported++;
    } catch (_) {
      void _;
    }
  }

  revalidatePath(`/contatos/${parsed.data.listId}`);
  return { imported, total: groups.length };
}

const importFromInstanceSchema = z.object({
  listId: z.string().min(1),
  instanceName: z.string().min(1),
});

export async function importFromInstance(listId: string, instanceName: string) {
  const user = await getCurrentUser();

  const parsed = importFromInstanceSchema.safeParse({ listId, instanceName });
  if (!parsed.success) return { error: "Dados inválidos." };

  const list = await prisma.contactList.findFirst({
    where: { id: parsed.data.listId, userId: user.id },
  });
  if (!list) return { error: "Lista não encontrada." };

  let contacts: Array<{ remoteJid: string; pushName: string | null }>;
  try {
    contacts = await evolutionClient.fetchContacts(parsed.data.instanceName);
  } catch {
    return { error: "Não foi possível buscar contatos. Verifique se a instância está conectada." };
  }

  const toImport = contacts
    .filter((c) => c.remoteJid && !c.remoteJid.includes("@g.us") && c.remoteJid !== "0@s.whatsapp.net")
    .map((c) => {
      const digits = c.remoteJid.replace(/@s\.whatsapp\.net$/, "").replace(/\D/g, "");
      const phone = digits.length < 12 ? `55${digits}` : digits;
      return { phone, name: c.pushName?.trim() || null };
    })
    .filter((c) => c.phone.length >= 10);

  if (toImport.length === 0) return { imported: 0, total: 0 };

  let imported = 0;
  for (const contact of toImport) {
    try {
      await prisma.contact.upsert({
        where: { contactListId_phoneNumber: { contactListId: parsed.data.listId, phoneNumber: contact.phone } },
        update: contact.name ? { name: contact.name } : {},
        create: { contactListId: parsed.data.listId, phoneNumber: contact.phone, name: contact.name },
      });
      imported++;
    } catch {
      // intentional: skip individual upsert failures (duplicates, constraint errors)
    }
  }

  revalidatePath(`/contatos/${parsed.data.listId}`);
  return { imported, total: toImport.length };
}

const validateNumbersSchema = z.object({
  listId: z.string().min(1),
  instanceName: z.string().min(1),
});

export async function validateContactListNumbers(listId: string, instanceName: string) {
  const user = await getCurrentUser();

  const parsed = validateNumbersSchema.safeParse({ listId, instanceName });
  if (!parsed.success) {
    return { error: "Dados inválidos." };
  }

  const list = await prisma.contactList.findFirst({
    where: { id: parsed.data.listId, userId: user.id },
    include: {
      contacts: {
        select: {
          id: true,
          phoneNumber: true,
          customFields: true,
        },
      },
    },
  });

  if (!list) return { error: "Lista não encontrada." };
  if (list.contacts.length === 0) {
    return { valid: 0, invalid: 0, total: 0 };
  }

  let valid = 0;
  let invalid = 0;

  try {
    for (let index = 0; index < list.contacts.length; index += 50) {
      const batch = list.contacts.slice(index, index + 50);
      const phones = batch.map((contact) => contact.phoneNumber);
      const results = await evolutionClient.validateNumbers(parsed.data.instanceName, phones);
      const existsByNumber = new Map(results.map((result) => [result.number, result.exists]));

      await Promise.all(
        batch.map(async (contact) => {
          const isValid = existsByNumber.get(contact.phoneNumber) ?? false;
          if (isValid) valid += 1;
          else invalid += 1;

          const customFields =
            contact.customFields && typeof contact.customFields === "object" && !Array.isArray(contact.customFields)
              ? (contact.customFields as Record<string, unknown>)
              : {};

          await prisma.contact.update({
            where: { id: contact.id },
            data: {
              customFields: {
                ...customFields,
                whatsappValid: isValid ? "true" : "false",
              },
            },
          });
        }),
      );
    }
  } catch (err) {
    console.error("Erro ao validar números:", err);
    return { error: "Não foi possível validar os números. Verifique se a instância está conectada." };
  }

  revalidatePath(`/contatos/${parsed.data.listId}`);
  return { valid, invalid, total: list.contacts.length };
}

