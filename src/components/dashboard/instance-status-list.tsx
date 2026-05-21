import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { DashboardStats } from "@/actions/dashboard";

type InstanceStatusListProps = {
  instances: DashboardStats["instances"];
};

export function InstanceStatusList({ instances }: InstanceStatusListProps) {
  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle>Status das Instâncias</CardTitle>
      </CardHeader>
      <CardContent>
        {instances.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma instância encontrada.</p>
        ) : (
          <div className="space-y-4">
            {instances.map((instance) => (
              <div key={instance.id} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                <div className="flex flex-col gap-1">
                  <span className="font-medium text-sm">{instance.instanceName}</span>
                  {instance.phoneNumber && (
                    <span className="text-xs text-muted-foreground">{instance.phoneNumber}</span>
                  )}
                </div>
                <StatusBadge status={instance.status} />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
