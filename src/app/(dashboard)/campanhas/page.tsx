import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { DeleteCampaignButton } from "@/components/campaigns/campaign-actions";
import Link from "next/link";
import { CampaignStatus } from "@prisma/client";

function getStatusBadge(status: CampaignStatus) {
  switch (status) {
    case "DRAFT":
      return <Badge variant="secondary">Rascunho</Badge>;
    case "SCHEDULED":
      return <Badge variant="outline" className="bg-[rgba(37,211,102,0.1)] text-[#25D366] border border-[rgba(37,211,102,0.2)]">Agendada</Badge>;
    case "RUNNING":
      return <Badge variant="default" className="bg-[rgba(37,211,102,0.1)] text-[#25D366] border border-[rgba(37,211,102,0.2)]">Em Execução</Badge>;
    case "PAUSED":
      return <Badge variant="outline" className="bg-[rgba(245,158,11,0.1)] text-[#f59e0b] border border-[rgba(245,158,11,0.2)]">Pausada</Badge>;
    case "COMPLETED":
      return <Badge variant="default" className="bg-[rgba(37,211,102,0.15)] text-[#25D366] border border-[rgba(37,211,102,0.3)]">Concluída ✓</Badge>;
    case "FAILED":
      return <Badge variant="destructive">Falhou</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

function formatEstimatedTime(pendingCount: number, throttleDelayMs: number): string {
  const totalMs = pendingCount * throttleDelayMs;
  const totalSeconds = Math.ceil(totalMs / 1000);
  if (totalSeconds < 60) return `~${totalSeconds}s`;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes < 60) return seconds > 0 ? `~${minutes}m ${seconds}s` : `~${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `~${hours}h ${mins}m` : `~${hours}h`;
}

export default async function CampanhasPage() {
  const user = await getCurrentUser();

  const campaigns = await prisma.campaign.findMany({
    where: { userId: user.id },
    include: {
      waInstance: { select: { instanceName: true } },
      _count: { select: { messages: true } },
      messages: {
        select: { status: true }
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
                  <TableHead className="text-center">Total</TableHead>
                  <TableHead className="text-center">Enviadas</TableHead>
                  <TableHead className="text-center">Entregues</TableHead>
                  <TableHead>Progresso</TableHead>
                  <TableHead>Criada em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map((campaign) => {
                  const total = campaign._count.messages;
                  const sent = campaign.messages.filter(m => ["SENT", "DELIVERED", "READ"].includes(m.status)).length;
                  const received = campaign.messages.filter(m => ["DELIVERED", "READ"].includes(m.status)).length;
                  const pending = campaign.messages.filter(m => m.status === "PENDING").length;
                  const progress = total > 0 ? Math.round((sent / total) * 100) : 0;
                  const isActive = campaign.status === "RUNNING" && pending > 0;

                  return (
                    <TableRow key={campaign.id}>
                      <TableCell className="font-medium">{campaign.name}</TableCell>
                      <TableCell>{campaign.waInstance.instanceName}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {getStatusBadge(campaign.status)}
                          {isActive && (
                            <span className="text-xs text-[#f59e0b] font-mono">
                              {formatEstimatedTime(pending, campaign.throttleDelay)} restante
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-mono text-sm">{total}</TableCell>
                      <TableCell className="text-center font-mono text-sm text-[#25D366]">{sent}</TableCell>
                      <TableCell className="text-center font-mono text-sm text-[#25D366]">{received}</TableCell>
                      <TableCell className="w-[180px]">
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
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/campanhas/${campaign.id}`}>
                            <Button variant="ghost" size="sm">
                              Ver detalhes
                            </Button>
                          </Link>
                          <DeleteCampaignButton campaignId={campaign.id} status={campaign.status} />
                        </div>
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
