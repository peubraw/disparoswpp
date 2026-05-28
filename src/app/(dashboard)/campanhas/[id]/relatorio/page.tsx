import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-utils";
import { DeliveryChart } from "@/components/reports/delivery-chart";
import { MessageTable } from "@/components/reports/message-table";
import { AutoRefresh } from "@/components/reports/auto-refresh";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { MessageStatus, Prisma } from "@prisma/client";
import { ArrowLeft, CheckCircle2, Clock, XCircle, MailOpen, Send } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function CampaignReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const campaignId = resolvedParams.id;
  
  const pageParam = typeof resolvedSearchParams.page === "string" ? resolvedSearchParams.page : "1";
  const page = parseInt(pageParam, 10);
  const statusFilter = typeof resolvedSearchParams.status === "string" ? resolvedSearchParams.status : "ALL";
  const pageSize = 50;

  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    select: { userId: true, status: true, name: true, createdAt: true }
  });

  if (!campaign) {
    notFound();
  }
  if (campaign.userId !== user.id) {
    redirect("/dashboard");
  }

  const statsQuery = await prisma.message.groupBy({
    by: ["status"],
    where: { campaignId },
    _count: { id: true },
  });

  const stats = {
    total: 0,
    pending: 0,
    sent: 0,
    delivered: 0,
    read: 0,
    failed: 0,
  };

  for (const group of statsQuery) {
    stats.total += group._count.id;
    if (group.status === MessageStatus.PENDING) stats.pending += group._count.id;
    else if (group.status === MessageStatus.SENT) stats.sent += group._count.id;
    else if (group.status === MessageStatus.DELIVERED) stats.delivered += group._count.id;
    else if (group.status === MessageStatus.READ) stats.read += group._count.id;
    else if (group.status === MessageStatus.FAILED) stats.failed += group._count.id;
  }

  const processedCount = stats.total - stats.pending;
  const progressPercent = stats.total > 0 ? Math.round((processedCount / stats.total) * 100) : 0;
  const sentPercent = stats.total > 0 ? Math.round(((stats.sent + stats.delivered + stats.read) / stats.total) * 100) : 0;
  const deliveredPercent = stats.total > 0 ? Math.round(((stats.delivered + stats.read) / stats.total) * 100) : 0;
  const readPercent = stats.total > 0 ? Math.round((stats.read / stats.total) * 100) : 0;
  const failedPercent = stats.total > 0 ? Math.round((stats.failed / stats.total) * 100) : 0;

  const whereClause: Prisma.MessageWhereInput = { campaignId };
  const validStatuses: string[] = Object.values(MessageStatus);
  if (statusFilter && statusFilter !== "ALL" && validStatuses.includes(statusFilter)) {
    whereClause.status = statusFilter as MessageStatus;
  }

  const [messages, totalFiltered, chartMessages] = await Promise.all([
    prisma.message.findMany({
      where: whereClause,
      orderBy: [
        { sentAt: "desc" },
        { createdAt: "desc" }
      ],
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        contactPhone: true,
        status: true,
        sentAt: true,
        errorMessage: true,
      }
    }),
    prisma.message.count({ where: whereClause }),
    prisma.message.findMany({
      where: {
        campaignId,
        sentAt: { not: null }
      },
      select: {
        status: true,
        sentAt: true,
      },
      orderBy: { sentAt: "asc" }
    })
  ]);

  const totalPages = Math.ceil(totalFiltered / pageSize);

  return (
    <div data-testid="campaign-report" className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <AutoRefresh isActive={campaign.status === "RUNNING"} intervalMs={5000} />
      
      <div className="flex items-center space-x-4">
        <Link href="/dashboard">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Relatório: {campaign.name}</h2>
          <p className="text-muted-foreground">
            Status da campanha: <span className="font-semibold">{campaign.status}</span>
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Progresso de Envio</span>
          <span>
            {processedCount} de {stats.total} mensagens ({progressPercent}%)
          </span>
        </div>
        <Progress value={progressPercent} className="h-2" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Enviadas</CardTitle>
            <Send className="h-4 w-4 text-[#25D366]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.sent + stats.delivered + stats.read}</div>
            <p className="text-xs text-muted-foreground">{sentPercent}% do total</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Entregues</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-[#25D366]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.delivered + stats.read}</div>
            <p className="text-xs text-muted-foreground">{deliveredPercent}% do total</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lidas</CardTitle>
            <MailOpen className="h-4 w-4 text-[#25D366]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.read}</div>
            <p className="text-xs text-muted-foreground">{readPercent}% do total</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Falhas</CardTitle>
            <XCircle className="h-4 w-4 text-[#ef4444]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.failed}</div>
            <p className="text-xs text-muted-foreground">{failedPercent}% do total</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-7">
        <div className="lg:col-span-7">
          <DeliveryChart data={chartMessages} />
        </div>
      </div>

      <Card className="col-span-1">
        <CardHeader>
          <CardTitle>Histórico de Mensagens</CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div>Carregando mensagens...</div>}>
            <MessageTable 
              messages={messages} 
              pagination={{
                page,
                pageSize,
                totalItems: totalFiltered,
                totalPages,
              }}
            />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
