import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-utils";
import { CampaignWizard } from "./campaign-wizard";
import { WaInstanceStatus } from "@prisma/client";

export default async function NovaCampanhaPage() {
  const user = await getCurrentUser();

  const instances = await prisma.waInstance.findMany({
    where: { userId: user.id, status: WaInstanceStatus.CONNECTED },
    select: { id: true, instanceName: true },
  });

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
