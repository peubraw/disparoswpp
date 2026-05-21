import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import { CampaignStatus } from "@prisma/client";

function getStatusBadge(status: CampaignStatus) {
  switch (status) {
    case "DRAFT":
      return <Badge variant="secondary">Rascunho</Badge>;
    case "SCHEDULED":
      return <Badge variant="outline" className="bg-blue-50 text-blue-700">Agendada</Badge>;
    case "RUNNING":
      return <Badge variant="default" className="bg-green-600">Em Execução</Badge>;
    case "PAUSED":
      return <Badge variant="outline" className="bg-amber-100 text-amber-800">Pausada</Badge>;
    case "COMPLETED":
      return <Badge variant="default" className="bg-gray-800">Concluída</Badge>;
    case "FAILED":
      return <Badge variant="destructive">Falhou</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

export default async function CampanhasPage() {
  const user = await getCurrentUser();

  const campaigns = await prisma.campaign.findMany({
    where: { userId: user.id },
    include: {
      waInstance: { select: { instanceName: true } },
      _count: { select: { messages: true } },
      messages: {
        where: { status: { in: ["SENT", "DELIVERED", "READ"] } },
        select: { id: true }
      }
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Campanhas</h2>
        <Link href="/campanhas/nova">
          <Button>Nova Campanha</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Suas Campanhas</CardTitle>
        </CardHeader>
        <CardContent>
          {campaigns.length === 0 ? (
            <div className="flex min-h-[400px] flex-col items-center justify-center rounded-md border border-dashed p-8 text-center animate-in fade-in-50">
              <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
                <h3 className="mt-4 text-lg font-semibold">Nenhuma campanha criada</h3>
                <p className="mb-4 mt-2 text-sm text-muted-foreground">
                  Crie sua primeira campanha para começar a enviar mensagens em massa.
                </p>
                <Link href="/campanhas/nova">
                  <Button>Criar Campanha</Button>
                </Link>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Instância</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Progresso</TableHead>
                  <TableHead>Criada em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map((campaign) => {
                  const total = campaign._count.messages;
                  const sent = campaign.messages.length;
                  const progress = total > 0 ? Math.round((sent / total) * 100) : 0;

                  return (
                    <TableRow key={campaign.id}>
                      <TableCell className="font-medium">{campaign.name}</TableCell>
                      <TableCell>{campaign.waInstance.instanceName}</TableCell>
                      <TableCell>{getStatusBadge(campaign.status)}</TableCell>
                      <TableCell className="w-[200px]">
                        <div className="flex items-center gap-2">
                          <Progress value={progress} className="h-2 flex-1" />
                          <span className="text-xs text-muted-foreground w-9 text-right">
                            {progress}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {campaign.createdAt.toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/campanhas/${campaign.id}`}>
                          <Button variant="ghost" size="sm">
                            Ver detalhes
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
