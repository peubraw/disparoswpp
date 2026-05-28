import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardStats } from "@/actions/dashboard";
import { Activity, MessageSquare, PlayCircle, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

type StatsCardsProps = {
  stats: Pick<DashboardStats, 'connectedInstances' | 'totalInstances' | 'campaignsToday' | 'messagesToday' | 'deliveryRateToday'>;
};

export function StatsCards({ stats }: StatsCardsProps) {
  const { connectedInstances, totalInstances, campaignsToday, messagesToday, deliveryRateToday } = stats;
  
  const allConnected = connectedInstances === totalInstances && totalInstances > 0;
  const connectionColor = allConnected 
    ? "text-[#25D366] drop-shadow-[0_0_8px_rgba(37,211,102,0.4)]" 
    : connectedInstances > 0 
      ? "text-[#f59e0b] drop-shadow-[0_0_8px_rgba(245,158,11,0.4)]" 
      : "text-[#ef4444] drop-shadow-[0_0_8px_rgba(239,68,68,0.4)]";

  const cardClasses = "bg-[#111a16] border-[rgba(37,211,102,0.15)] rounded-xl transition-all duration-300 hover:border-[rgba(37,211,102,0.4)] hover:shadow-[0_0_15px_rgba(37,211,102,0.1)] hover:-translate-y-1 relative overflow-hidden group";
  const iconClasses = "h-5 w-5 text-[#25D366] opacity-70 group-hover:opacity-100 group-hover:animate-pulse-green transition-opacity";
  const titleClasses = "text-xs font-heading font-bold text-muted-foreground uppercase tracking-widest";
  const valueClasses = "text-3xl font-heading font-bold text-[#25D366] drop-shadow-[0_0_8px_rgba(37,211,102,0.4)] mt-2";

  return (
    <div data-testid="dashboard-stats" className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      <Card className={cardClasses}>
        <div className="absolute top-0 right-0 w-16 h-16 bg-[radial-gradient(circle_at_top_right,rgba(37,211,102,0.1)_0,transparent_70%)] pointer-events-none"></div>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className={titleClasses}>INSTÂNCIAS CONECTADAS</CardTitle>
          <Activity className={iconClasses} />
        </CardHeader>
        <CardContent>
          <div className={cn("text-3xl font-heading font-bold mt-2", connectionColor)}>
            {connectedInstances}/{totalInstances}
          </div>
        </CardContent>
      </Card>
      
      <Card className={cardClasses}>
        <div className="absolute top-0 right-0 w-16 h-16 bg-[radial-gradient(circle_at_top_right,rgba(37,211,102,0.1)_0,transparent_70%)] pointer-events-none"></div>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className={titleClasses}>CAMPANHAS HOJE</CardTitle>
          <PlayCircle className={iconClasses} />
        </CardHeader>
        <CardContent>
          <div className={valueClasses}>{campaignsToday}</div>
        </CardContent>
      </Card>

      <Card className={cardClasses}>
        <div className="absolute top-0 right-0 w-16 h-16 bg-[radial-gradient(circle_at_top_right,rgba(37,211,102,0.1)_0,transparent_70%)] pointer-events-none"></div>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className={titleClasses}>MENSAGENS HOJE</CardTitle>
          <MessageSquare className={iconClasses} />
        </CardHeader>
        <CardContent>
          <div className={valueClasses}>{messagesToday}</div>
        </CardContent>
      </Card>

      <Card className={cardClasses}>
        <div className="absolute top-0 right-0 w-16 h-16 bg-[radial-gradient(circle_at_top_right,rgba(37,211,102,0.1)_0,transparent_70%)] pointer-events-none"></div>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className={titleClasses}>TAXA DE ENTREGA</CardTitle>
          <Zap className={iconClasses} />
        </CardHeader>
        <CardContent>
          <div className={valueClasses}>{deliveryRateToday}%</div>
        </CardContent>
      </Card>
    </div>
  );
}
