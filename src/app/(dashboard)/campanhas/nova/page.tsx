import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-utils";
import { CampaignWizard } from "./campaign-wizard";
import { WaInstanceStatus } from "@prisma/client";
import { evolutionClient } from "@/lib/evolution-client";

export default async function NovaCampanhaPage() {
  const user = await getCurrentUser();

  const allInstances = await prisma.waInstance.findMany({
    where: { userId: user.id },
    select: { id: true, instanceName: true, status: true, phoneNumber: true },
  });

  await Promise.allSettled(
    allInstances.map(async (instance) => {
      try {
        const res = await evolutionClient.getInstanceStatus(instance.instanceName) as { instance?: { state?: string } };
        const state = res?.instance?.state;
        let newStatus: WaInstanceStatus = WaInstanceStatus.CONNECTING;
        if (state === "open") newStatus = WaInstanceStatus.CONNECTED;
        else if (state === "close") newStatus = WaInstanceStatus.DISCONNECTED;

        if (newStatus !== instance.status) {
          await prisma.waInstance.update({
            where: { id: instance.id },
            data: { status: newStatus },
          });
          instance.status = newStatus;
        }
      } catch {
      }
    })
  );

  const instances = allInstances
    .filter((i) => i.status === WaInstanceStatus.CONNECTED)
    .map((i) => ({ id: i.id, instanceName: i.instanceName }));

  const contactLists = await prisma.contactList.findMany({
    where: { userId: user.id },
    include: {
      _count: { select: { contacts: true } },
    },
  });

  const serializedLists = contactLists.map((list) => ({
    id: list.id,
    name: list.name,
    contactCount: list._count.contacts,
  }));

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Nova Campanha</h2>
      </div>
      <CampaignWizard instances={instances} contactLists={serializedLists} />
    </div>
  );
}
