export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { evolutionClient } from "@/lib/evolution-client";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ instanceId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { instanceId } = await params;

  const instance = await prisma.waInstance.findFirst({
    where: { id: instanceId, userId: session.user.id },
  });

  if (!instance) {
    return NextResponse.json({ error: "Instância não encontrada." }, { status: 404 });
  }

  try {
    const qr = await evolutionClient.getQRCode(instance.instanceName);
    return NextResponse.json({ base64: qr.base64, code: qr.code });
  } catch {
    return NextResponse.json({ error: "QR code não disponível." }, { status: 502 });
  }
}
