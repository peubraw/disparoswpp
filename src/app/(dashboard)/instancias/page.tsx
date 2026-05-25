import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-utils";
import { InstanceCard } from "@/components/instances/instance-card";
import { evolutionClient } from "@/lib/evolution-client";
import { WaInstanceStatus } from "@prisma/client";

export default async function InstanciasPage() {
  const user = await getCurrentUser();

  const instances = await prisma.waInstance.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  // Sync status from Evolution API on every page load
  await Promise.allSettled(
    instances.map(async (instance) => {
      try {
        const res = await evolutionClient.getInstanceStatus(instance.instanceName) as { instance?: { state?: string } };
        const state = res?.instance?.state;
        let newStatus: WaInstanceStatus = WaInstanceStatus.CONNECTING;
        if (state === "open") newStatus = WaInstanceStatus.CONNECTED;
        else if (state === "close") newStatus = WaInstanceStatus.DISCONNECTED;

        let phoneNumber = instance.phoneNumber;
        if (newStatus === WaInstanceStatus.CONNECTED && !phoneNumber) {
          const all = await evolutionClient.request<Array<{ ownerJid?: string }>>({ method: "GET", url: "/instance/fetchInstances" });
          const found = Array.isArray(all) ? all.find((i: { name?: string }) => i.name === instance.instanceName) : null;
          const jid = (found as { ownerJid?: string } | null)?.ownerJid;
          if (jid) phoneNumber = jid.replace("@s.whatsapp.net", "");
        }

        if (newStatus !== instance.status || phoneNumber !== instance.phoneNumber) {
          await prisma.waInstance.update({
            where: { id: instance.id },
            data: { status: newStatus, ...(phoneNumber ? { phoneNumber } : {}) },
          });
          instance.status = newStatus;
          if (phoneNumber) instance.phoneNumber = phoneNumber;
        }
      } catch {
      }
    })
  );

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Instâncias WhatsApp</h1>
        <Link
          href="/instancias/nova"
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Nova Instância
        </Link>
      </div>

      {instances.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <p className="text-muted-foreground">
            Nenhuma instância conectada. Adicione sua primeira instância.
          </p>
          <Link
            href="/instancias/nova"
            className="mt-4 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Adicionar instância
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {instances.map((instance) => (
            <InstanceCard
              key={instance.id}
              instance={{
                id: instance.id,
                instanceName: instance.instanceName,
                status: instance.status,
                phoneNumber: instance.phoneNumber,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
