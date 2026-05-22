import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CampaignStatus, MessageStatus } from "@prisma/client";
import { BarChart3, CheckCircle2, MailOpen, Send, XCircle } from "lucide-react";

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

export default async function RelatoriosPage() {
  const user = await getCurrentUser();

  const campaigns = await prisma.campaign.findMany({
    where: { userId: user.id },
    include: {
      waInstance: { select: { instanceName: true } },
      messages: {
        select: { status: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const campaignsWithStats = campaigns.map((campaign) => {
    const total = campaign.messages.length;
    const sent = campaign.messages.filter((m) =>
      [MessageStatus.SENT, MessageStatus.DELIVERED, MessageStatus.READ].includes(m.status)
    ).length;
    const delivered = campaign.messages.filter((m) =>
      [MessageStatus.DELIVERED, MessageStatus.READ].includes(m.status)
    ).length;
    const read = campaign.messages.filter((m) => m.status === MessageStatus.READ).length;
    const failed = campaign.messages.filter((m) => m.status === MessageStatus.FAILED).length;
    const deliveryRate = total > 0 ? Math.round((delivered / total) * 100) : 0;

    return { ...campaign, stats: { total, sent, delivered, read, failed, deliveryRate } };
  });

  const totals = campaignsWithStats.reduce(
    (acc, c) => ({
      sent: acc.sent + c.stats.sent,
      delivered: acc.delivered + c.stats.delivered,
      read: acc.read + c.stats.read,
      failed: acc.failed + c.stats.failed,
    }),
    { sent: 0, delivered: 0, read: 0, failed: 0 }
  );

  return (
    <div className="flex-1 space-y-6 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Relatórios</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Enviadas</CardTitle>
            <Send className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.sent}</div>
            <p className="text-xs text-muted-foreground">em todas as campanhas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Entregues</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.delivered}</div>
            <p className="text-xs text-muted-foreground">confirmadas pelo WhatsApp</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Lidas</CardTitle>
            <MailOpen className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.read}</div>
            <p className="text-xs text-muted-foreground">visualizadas pelo destinatário</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Falhas</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.failed}</div>
            <p className="text-xs text-muted-foreground">não entregues</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Relatório por Campanha
          </CardTitle>
        </CardHeader>
        <CardContent>
          {campaignsWithStats.length === 0 ? (
            <div className="flex min-h-[400px] flex-col items-center justify-center rounded-md border border-dashed p-8 text-center animate-in fade-in-50">
              <h3 className="mt-4 text-lg font-semibold">Nenhuma campanha ainda</h3>
              <p className="mb-4 mt-2 text-sm text-muted-foreground">
                Crie sua primeira campanha para ver os relatórios aqui.
              </p>
              <Link href="/campanhas/nova">
                <Button>Criar Campanha</Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campanha</TableHead>
                  <TableHead>Instância</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Enviadas</TableHead>
                  <TableHead className="text-center">Entregues</TableHead>
                  <TableHead className="text-center">Lidas</TableHead>
                  <TableHead className="text-center">Falhas</TableHead>
                  <TableHead>Taxa de Entrega</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaignsWithStats.map((campaign) => (
                  <TableRow key={campaign.id}>
                    <TableCell className="font-medium">{campaign.name}</TableCell>
                    <TableCell>{campaign.waInstance.instanceName}</TableCell>
                    <TableCell>{getStatusBadge(campaign.status)}</TableCell>
                    <TableCell className="text-center">{campaign.stats.sent}</TableCell>
                    <TableCell className="text-center">{campaign.stats.delivered}</TableCell>
                    <TableCell className="text-center">{campaign.stats.read}</TableCell>
                    <TableCell className="text-center text-red-600">{campaign.stats.failed}</TableCell>
                    <TableCell className="w-[160px]">
                      <div className="flex items-center gap-2">
                        <Progress value={campaign.stats.deliveryRate} className="h-2 flex-1" />
                        <span className="text-xs text-muted-foreground w-9 text-right">
                          {campaign.stats.deliveryRate}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/campanhas/${campaign.id}/relatorio`}>
                        <Button variant="ghost" size="sm">
                          Ver relatório
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
