import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { DashboardStats } from "@/actions/dashboard";
import { Progress } from "@/components/ui/progress";

type RecentCampaignsProps = {
  campaigns: DashboardStats["recentCampaigns"];
};

export function RecentCampaigns({ campaigns }: RecentCampaignsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Últimas Campanhas</CardTitle>
      </CardHeader>
      <CardContent>
        {campaigns.length === 0 ? (
          <p className="text-muted-foreground text-sm">Nenhuma campanha ainda.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Progresso</TableHead>
                <TableHead>Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.map((campaign) => (
                <TableRow key={campaign.id}>
                  <TableCell className="font-medium">{campaign.name}</TableCell>
                  <TableCell>
                    <StatusBadge status={campaign.status} />
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-muted-foreground">
                        {campaign.sentCount} / {campaign.totalCount}
                      </span>
                      <Progress 
                        value={campaign.totalCount > 0 ? (campaign.sentCount / campaign.totalCount) * 100 : 0} 
                        className="h-2 w-[100px]" 
                      />
                    </div>
                  </TableCell>
                  <TableCell>{campaign.createdAt.toLocaleDateString("pt-BR")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
