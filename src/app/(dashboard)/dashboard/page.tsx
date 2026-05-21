import { Suspense } from "react";
import { getDashboardStats } from "@/actions/dashboard";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { MessagesChart } from "@/components/dashboard/messages-chart";
import { RecentCampaigns } from "@/components/dashboard/recent-campaigns";
import { InstanceStatusList } from "@/components/dashboard/instance-status-list";
import { Skeleton } from "@/components/ui/skeleton";

export default async function DashboardPage() {
  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      </div>

      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </Suspense>
    </div>
  );
}

async function DashboardContent() {
  try {
    const stats = await getDashboardStats();

    return (
      <div className="space-y-6">
        <StatsCards stats={stats} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <MessagesChart data={stats.chartData} />
          <InstanceStatusList instances={stats.instances} />
        </div>
        <RecentCampaigns campaigns={stats.recentCampaigns} />
      </div>
    );
  } catch (error) {
    return (
      <div className="flex h-[400px] items-center justify-center rounded-md border border-dashed">
        <p className="text-sm text-muted-foreground">Erro ao carregar o dashboard. Tente novamente.</p>
      </div>
    );
  }
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Skeleton className="h-[400px] w-full" />
        <Skeleton className="h-[400px] w-full" />
      </div>
      <Skeleton className="h-[300px] w-full" />
    </div>
  );
}
