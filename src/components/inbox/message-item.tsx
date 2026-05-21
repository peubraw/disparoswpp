"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { markAsRead } from "@/actions/inbox";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useTransition } from "react";
import { Badge } from "@/components/ui/badge";

type MessageItemProps = {
  message: {
    id: string;
    fromPhone: string;
    body: string;
    receivedAt: Date;
    isRead: boolean;
    waInstance?: { instanceName: string };
  };
};

export function MessageItem({ message }: MessageItemProps) {
  const [isPending, startTransition] = useTransition();

  const handleMarkAsRead = () => {
    if (message.isRead || isPending) return;
    startTransition(async () => {
      await markAsRead(message.id);
    });
  };

  const formattedTime = format(new Date(message.receivedAt), "dd/MM/yy HH:mm", {
    locale: ptBR,
  });

  const truncatedBody =
    message.body.length > 100
      ? message.body.slice(0, 100) + "..."
      : message.body;

  const phoneDigits = message.fromPhone.replace(/\D/g, "");
  const initials = phoneDigits.slice(0, 2) || "WA";

  return (
    <div
      onClick={handleMarkAsRead}
      className={cn(
        "flex items-start gap-4 p-4 border-b transition-colors",
        !message.isRead ? "bg-muted/50 cursor-pointer hover:bg-muted" : "bg-card"
      )}
    >
      <Avatar className="h-10 w-10 border">
        <AvatarFallback className="bg-primary/10 text-primary text-xs">
          {initials}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 space-y-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 font-medium">
            <span
              className={cn(
                "truncate",
                !message.isRead && "font-bold text-foreground"
              )}
            >
              {message.fromPhone}
            </span>
            {!message.isRead && (
              <span className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0" />
            )}
          </div>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {formattedTime}
          </span>
        </div>

        <p
          className={cn(
            "text-sm break-words",
            !message.isRead ? "text-foreground font-medium" : "text-muted-foreground"
          )}
        >
          {truncatedBody}
        </p>

        {message.waInstance && (
          <div className="text-[10px] text-muted-foreground mt-1">
            Instância: {message.waInstance.instanceName}
          </div>
        )}
      </div>

      {!message.isRead && (
        <div className="flex-shrink-0 self-center">
          <Badge variant="secondary" className="text-[10px] whitespace-nowrap">
            Não lido
          </Badge>
        </div>
      )}
    </div>
  );
}
