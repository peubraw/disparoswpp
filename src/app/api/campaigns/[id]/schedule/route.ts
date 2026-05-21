export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { scheduleCampaign } from "@/actions/campaigns";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (
    typeof body !== "object" ||
    body === null ||
    !("scheduledFor" in body) ||
    typeof (body as Record<string, unknown>).scheduledFor !== "string"
  ) {
    return NextResponse.json({ error: "scheduledFor is required" }, { status: 400 });
  }

  const { scheduledFor } = body as { scheduledFor: string };

  const result = await scheduleCampaign(id, scheduledFor);

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json(result);
}
