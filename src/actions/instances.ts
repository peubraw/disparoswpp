"use server";

import { prisma } from "@/lib/prisma";
import { evolutionClient } from "@/lib/evolution-client";
import { getCurrentUser } from "@/lib/auth-utils";
import { WaInstanceStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

const MAX_INSTANCES = 5;

export async function createInstance(name: string) {
  const user = await getCurrentUser();

  const count = await prisma.waInstance.count({ where: { userId: user.id } });
  if (count >= MAX_INSTANCES) {
    return { error: "Limite de 5 instâncias atingido." };
  }

  try {
    await evolutionClient.createInstance(name);
  } catch {
    return { error: "Erro ao criar instância na Evolution API." };
  }

  const instance = await prisma.waInstance.create({
    data: {
      userId: user.id,
      instanceName: name,
      status: WaInstanceStatus.CONNECTING,
    },
  });

  revalidatePath("/instancias");
  return { success: true, instance };
}

export async function getInstanceStatus(instanceId: string) {
  const user = await getCurrentUser();

  const instance = await prisma.waInstance.findFirst({
    where: { id: instanceId, userId: user.id },
  });
  if (!instance) return { error: "Instância não encontrada." };

  try {
    const status = await evolutionClient.getInstanceStatus(instance.instanceName) as { instance?: { state?: string } };
    const state = status?.instance?.state;

    let newStatus: WaInstanceStatus = WaInstanceStatus.CONNECTING;
    if (state === "open") newStatus = WaInstanceStatus.CONNECTED;
    else if (state === "close") newStatus = WaInstanceStatus.DISCONNECTED;

    await prisma.waInstance.update({
      where: { id: instanceId },
      data: { status: newStatus },
    });

    return { status: newStatus };
  } catch {
    return { error: "Erro ao consultar status." };
  }
}

export async function deleteInstance(instanceId: string) {
  const user = await getCurrentUser();

  const instance = await prisma.waInstance.findFirst({
    where: { id: instanceId, userId: user.id },
  });
  if (!instance) return { error: "Instância não encontrada." };

  try {
    await evolutionClient.deleteInstance(instance.instanceName);
  } catch (_) {}

  await prisma.waInstance.delete({ where: { id: instanceId } });
  revalidatePath("/instancias");
  return { success: true };
}
