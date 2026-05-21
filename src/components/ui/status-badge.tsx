import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type StatusBadgeProps = {
  status: string;
  className?: string;
};

const statusColors: Record<string, string> = {
  CONNECTED: "bg-green-500 text-white",
  DISCONNECTED: "bg-red-500 text-white",
  CONNECTING: "bg-yellow-500 text-white",
  RUNNING: "bg-blue-500 text-white",
  PAUSED: "bg-orange-500 text-white",
  COMPLETED: "bg-green-600 text-white",
  FAILED: "bg-red-600 text-white",
  DRAFT: "bg-gray-500 text-white",
  SCHEDULED: "bg-purple-500 text-white",
  PENDING: "bg-gray-400 text-white",
  SENT: "bg-blue-400 text-white",
  DELIVERED: "bg-blue-600 text-white",
  READ: "bg-green-400 text-white",
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <Badge className={cn(statusColors[status] ?? "bg-gray-500 text-white", className)}>
      {status}
    </Badge>
  );
}
