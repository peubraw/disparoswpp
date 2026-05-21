import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardStats } from "@/actions/dashboard";
import { Activity, MessageSquare, PlayCircle, Zap } from "lucide-react";

type StatsCardsProps = {
  stats: Pick<DashboardStats, 'connectedInstances' | 'totalInstances' | 'campaignsToday' | 'messagesToday' | 'deliveryRateToday'>;
};

export function StatsCards({ stats }: StatsCardsProps) {
  const { connectedInstances, totalInstances, campaignsToday, messagesToday, deliveryRateToday } = stats;
  
  const allConnected = connectedInstances === totalInstances && totalInstances > 0;
  const connectionColor = allConnected ? "text-green-500" : connectedInstances > 0 ? "text-yellow-500" : "text-red-500";

  return (
    <div data-testid="dashboard-stats" className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Instâncias Conectadas</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${connectionColor}`}>
            {connectedInstances}/{totalInstances}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Campanhas Hoje</CardTitle>
          <PlayCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{campaignsToday}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Mensagens Enviadas Hoje</CardTitle>
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{messagesToday}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Taxa de Entrega</CardTitle>
          <Zap className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{deliveryRateToday}%</div>
        </CardContent>
      </Card>
    </div>
  );
}
