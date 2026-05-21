import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { evolutionClient } from "@/lib/evolution-client";
import { WaInstanceStatus } from "@prisma/client";

const MAX_INSTANCES = 5;

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json() as { name?: unknown };
  const name = typeof body.name === "string" ? body.name.trim() : "";

  if (!name) {
    return NextResponse.json({ error: "Nome é obrigatório." }, { status: 400 });
  }

  const count = await prisma.waInstance.count({ where: { userId: session.user.id } });
  if (count >= MAX_INSTANCES) {
    return NextResponse.json({ error: "Limite de 5 instâncias atingido." }, { status: 422 });
  }

  try {
    await evolutionClient.createInstance(name);
  } catch {
    return NextResponse.json({ error: "Erro ao criar instância na Evolution API." }, { status: 502 });
  }

  const instance = await prisma.waInstance.create({
    data: {
      userId: session.user.id,
      instanceName: name,
      status: WaInstanceStatus.CONNECTING,
    },
  });

  return NextResponse.json({ instance }, { status: 201 });
}
