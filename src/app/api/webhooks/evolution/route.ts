import { NextRequest, NextResponse } from "next/server";
import {
  processMessagesUpdate,
  processConnectionUpdate,
  processMessagesUpsert,
} from "@/lib/webhook-processor";

export async function POST(req: NextRequest) {
  // Validate apikey header
  const apikey = req.headers.get("apikey");
  if (!apikey || apikey !== process.env.EVOLUTION_API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  let body: { event?: string; instance?: string; data?: Record<string, unknown> };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  
  const { event, instance: instanceName, data } = body;
  
  if (!event || !instanceName || !data) {
    return NextResponse.json({ received: true });
  }
  
  // Process in background (don't block response)
  void (async () => {
    try {
      if (event === "MESSAGES_UPDATE") {
        await processMessagesUpdate(instanceName, data);
      } else if (event === "CONNECTION_UPDATE") {
        await processConnectionUpdate(instanceName, data);
      } else if (event === "MESSAGES_UPSERT") {
        await processMessagesUpsert(instanceName, data);
      }
    } catch {
      // Silent failure — webhook should always return 200
    }
  })();
  
  return NextResponse.json({ received: true });
}
