import { getInboxMessages, markAllAsRead } from "@/actions/inbox";
import { getCurrentUser } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { MessageItem } from "@/components/inbox/message-item";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info, CheckCheck } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { redirect } from "next/navigation";

type PageProps = {
  params: Promise<{ instanceId: string }>;
};

export default async function InboxInstancePage({ params }: PageProps) {
  const { instanceId } = await params;
  const user = await getCurrentUser();

  const currentInstance = await prisma.waInstance.findFirst({
    where: { id: instanceId, userId: user.id },
  });

  if (!currentInstance) {
    redirect("/inbox");
  }

  const instances = await prisma.waInstance.findMany({
    where: { userId: user.id },
    select: { id: true, instanceName: true },
    orderBy: { createdAt: "desc" },
  });

  const messages = await getInboxMessages(instanceId);

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col gap-4 p-4 md:p-6">
      <Alert className="bg-amber-50 text-amber-900 border-amber-200">
        <Info className="h-4 w-4 text-amber-600" />
        <AlertTitle className="text-amber-800">Modo leitura</AlertTitle>
        <AlertDescription className="text-amber-700/90">
          Responda diretamente pelo seu celular. Esta caixa de entrada é apenas para visualização.
        </AlertDescription>
      </Alert>

      <div className="flex flex-1 gap-6 overflow-hidden">
        <aside className="w-64 shrink-0 flex-col gap-2 hidden md:flex">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">
            Instâncias
          </h2>
          <div className="flex-1 overflow-y-auto pr-4">
            <div className="flex flex-col gap-1">
              <Link
                href="/inbox"
                className="px-3 py-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground text-sm transition-colors"
              >
                Todas as mensagens
              </Link>
              {instances.map((instance) => (
                <Link
                  key={instance.id}
                  href={`/inbox/${instance.id}`}
                  className={`px-3 py-2 rounded-md font-medium text-sm transition-colors ${
                    instance.id === instanceId
                      ? "bg-secondary text-secondary-foreground"
                      : "hover:bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {instance.instanceName}
                </Link>
              ))}
            </div>
          </div>
        </aside>

        <main className="flex-1 flex flex-col border rounded-lg bg-card overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b">
            <h1 className="font-semibold text-lg">{currentInstance.instanceName}</h1>
            <form action={async () => { "use server"; await markAllAsRead(instanceId); }}>
              <Button type="submit" variant="outline" size="sm" className="gap-2 text-xs h-8">
                <CheckCheck className="h-4 w-4" />
                Marcar todas como lidas
              </Button>
            </form>
          </div>

          <div className="flex-1 overflow-y-auto">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-muted-foreground text-sm">
                Nenhuma mensagem recebida ainda.
              </div>
            ) : (
              <div className="flex flex-col">
                {messages.map((msg) => (
                  <MessageItem key={msg.id} message={msg} />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
