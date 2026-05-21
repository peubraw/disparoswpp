export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { configureWebhook } from "@/actions/webhook-config";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const { instanceName } = await req.json() as { instanceName?: string };
  if (!instanceName) {
    return NextResponse.json({ error: "instanceName é obrigatório." }, { status: 400 });
  }
  
  await configureWebhook(instanceName);
  return NextResponse.json({ success: true });
}
