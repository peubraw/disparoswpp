import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CountdownTimer } from "@/components/campaigns/countdown-timer";
import { CancelScheduleButton } from "./cancel-schedule-button";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function AgendadasPage() {
  const user = await getCurrentUser();

  const campaigns = await prisma.campaign.findMany({
    where: { userId: user.id, status: "SCHEDULED" },
    include: {
      waInstance: { select: { instanceName: true } },
    },
    orderBy: { scheduledFor: "asc" },
  });

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Campanhas Agendadas</h2>
        <Link href="/campanhas">
          <Button variant="outline">Ver todas</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Aguardando disparo</CardTitle>
        </CardHeader>
        <CardContent>
          {campaigns.length === 0 ? (
            <div className="flex min-h-[300px] flex-col items-center justify-center rounded-md border border-dashed p-8 text-center">
              <h3 className="mt-4 text-lg font-semibold">Nenhuma campanha agendada</h3>
              <p className="mb-4 mt-2 text-sm text-muted-foreground">
                Agende uma campanha para vê-la aqui com contagem regressiva.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Instância</TableHead>
                  <TableHead>Agendado para</TableHead>
                  <TableHead>Tempo restante</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map((campaign) => (
                  <TableRow key={campaign.id}>
                    <TableCell className="font-medium">{campaign.name}</TableCell>
                    <TableCell>{campaign.waInstance.instanceName}</TableCell>
                    <TableCell>
                      {campaign.scheduledFor
                        ? campaign.scheduledFor.toLocaleString("pt-BR")
                        : "—"}
                    </TableCell>
                    <TableCell>
                      {campaign.scheduledFor ? (
                        <CountdownTimer scheduledFor={campaign.scheduledFor} />
                      ) : (
                        <Badge variant="secondary">Sem data</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Link href={`/campanhas/${campaign.id}`}>
                        <Button variant="ghost" size="sm">
                          Detalhes
                        </Button>
                      </Link>
                      <CancelScheduleButton campaignId={campaign.id} />
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
