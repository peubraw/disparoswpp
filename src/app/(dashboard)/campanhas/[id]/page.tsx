import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-utils";
import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CampaignStatus, MessageStatus, MediaType } from "@prisma/client";
import { CampaignActions } from "@/components/campaigns/campaign-actions";

function getStatusBadge(status: CampaignStatus) {
  switch (status) {
    case "DRAFT": return <Badge variant="secondary">Rascunho</Badge>;
    case "SCHEDULED": return <Badge variant="outline" className="bg-[rgba(37,211,102,0.1)] text-[#25D366] border border-[rgba(37,211,102,0.2)]">Agendada</Badge>;
    case "RUNNING": return <Badge variant="default" className="bg-[rgba(37,211,102,0.1)] text-[#25D366] border border-[rgba(37,211,102,0.2)]">Em Execução</Badge>;
    case "PAUSED": return <Badge variant="outline" className="bg-[rgba(245,158,11,0.1)] text-[#f59e0b] border border-[rgba(245,158,11,0.2)]">Pausada</Badge>;
    case "COMPLETED": return <Badge variant="default" className="bg-[rgba(232,245,233,0.1)] text-[#e8f5e9]">Concluída</Badge>;
    case "FAILED": return <Badge variant="destructive">Falhou</Badge>;
    default: return <Badge variant="secondary">{status}</Badge>;
  }
}

function getMessageStatusBadge(status: MessageStatus) {
  switch (status) {
    case "PENDING": return <Badge variant="secondary">Pendente</Badge>;
    case "SENT": return <Badge variant="outline" className="bg-[rgba(37,211,102,0.1)] text-[#25D366] border border-[rgba(37,211,102,0.2)]">Enviada</Badge>;
    case "DELIVERED": return <Badge variant="default" className="bg-[rgba(37,211,102,0.1)] border border-[rgba(37,211,102,0.4)] text-[#25D366]">Entregue</Badge>;
    case "READ": return <Badge variant="default" className="bg-[rgba(37,211,102,0.1)] text-[#25D366] border border-[rgba(37,211,102,0.2)]">Lida</Badge>;
    case "FAILED": return <Badge variant="destructive">Falhou</Badge>;
    default: return <Badge variant="secondary">{status}</Badge>;
  }
}

export default async function CampanhaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  const { id } = await params;

  const campaign = await prisma.campaign.findFirst({
    where: { id, userId: user.id },
    include: {
      waInstance: true,
      messages: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      _count: {
        select: { messages: true }
      }
    },
  });

  if (!campaign) {
    notFound();
  }

  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

  const stats = await prisma.message.groupBy({
    by: ["status"],
    where: { campaignId: campaign.id },
    _count: true,
  });

  const statsMap = stats.reduce((acc, curr) => {
    acc[curr.status] = curr._count;
    return acc;
  }, {} as Record<string, number>);

  const total = campaign._count.messages;
  const sent = (statsMap["SENT"] || 0) + (statsMap["DELIVERED"] || 0) + (statsMap["READ"] || 0);
  const delivered = (statsMap["DELIVERED"] || 0) + (statsMap["READ"] || 0);
  const read = statsMap["READ"] || 0;
  const failed = statsMap["FAILED"] || 0;

  const progress = total > 0 ? Math.round((sent / total) * 100) : 0;

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{campaign.name}</h2>
          <div className="flex items-center gap-2 mt-2">
            {getStatusBadge(campaign.status)}
            <span className="text-sm text-muted-foreground">
              Instância: {campaign.waInstance.instanceName}
            </span>
          </div>
        </div>
        <CampaignActions campaignId={campaign.id} status={campaign.status} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Mensagens</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Enviadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sent}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{read}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Falhas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{failed}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Progresso da Campanha</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{progress}% Concluído</span>
                <span className="text-muted-foreground">{sent} / {total}</span>
              </div>
              <Progress value={progress} className="h-4" />
            </div>
            <div className="pt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Mensagem:</span>
              </div>
              <div className="rounded-md bg-muted p-3 whitespace-pre-wrap">
                {campaign.messageTemplate}
              </div>
              {campaign.mediaUrl && campaign.mediaType !== MediaType.NONE && (
                <div className="pt-2 space-y-1">
                  <span className="text-muted-foreground text-xs uppercase tracking-widest font-heading">Arquivo anexado:</span>
                  {campaign.mediaType === MediaType.IMAGE && (
                    <img src={`${basePath}${campaign.mediaUrl}`} alt="Imagem da campanha" className="max-w-xs rounded-md border border-[rgba(37,211,102,0.2)]" />
                  )}
                  {campaign.mediaType === MediaType.VIDEO && (
                    <video src={`${basePath}${campaign.mediaUrl}`} controls className="max-w-xs rounded-md border border-[rgba(37,211,102,0.2)]" />
                  )}
                  {campaign.mediaType === MediaType.AUDIO && (
                    <audio src={`${basePath}${campaign.mediaUrl}`} controls className="w-full" />
                  )}
                  {campaign.mediaType === MediaType.DOCUMENT && (
                    <a href={`${basePath}${campaign.mediaUrl}`} target="_blank" rel="noreferrer" className="text-[#25D366] underline text-sm font-mono">
                      📄 Abrir documento
                    </a>
                  )}
                </div>
              )}
              <div className="flex justify-between pt-2">
                <span className="text-muted-foreground">Intervalo:</span>
                <span>{campaign.throttleDelay / 1000}s</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Últimas Mensagens</CardTitle>
            <CardDescription>Acompanhe o status dos envios recentes.</CardDescription>
          </CardHeader>
          <CardContent>
            {campaign.messages.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Nenhuma mensagem processada ainda.
              </p>
            ) : (
              <div className="space-y-4">
                {campaign.messages.map(msg => (
                  <div key={msg.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{msg.contactPhone}</p>
                      <p className="text-xs text-muted-foreground">
                        {msg.createdAt.toLocaleDateString("pt-BR")} {msg.createdAt.toLocaleTimeString("pt-BR")}
                      </p>
                    </div>
                    {getMessageStatusBadge(msg.status)}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
