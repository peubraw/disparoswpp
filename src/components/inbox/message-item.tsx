"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { markAsRead, sendReply } from "@/actions/inbox";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useTransition, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Reply, CheckCircle2, AlertCircle } from "lucide-react";

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
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replySending, setReplySending] = useState(false);
  const [replyError, setReplyError] = useState<string | null>(null);
  const [replySuccess, setReplySuccess] = useState(false);

  const handleMarkAsRead = () => {
    if (message.isRead || isPending) return;
    startTransition(async () => {
      await markAsRead(message.id);
    });
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!replyText.trim() || replySending) return;

    setReplySending(true);
    setReplyError(null);
    setReplySuccess(false);

    try {
      const res = await sendReply(message.id, replyText);
      if (res.error) {
        setReplyError(res.error);
      } else {
        setReplySuccess(true);
        setReplyText("");
        setTimeout(() => {
          setShowReply(false);
          setReplySuccess(false);
        }, 2000);
      }
    } catch (err) {
      setReplyError("Erro inesperado ao enviar resposta.");
    } finally {
      setReplySending(false);
    }
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
        "flex items-start gap-4 p-4 border-b transition-colors group",
        !message.isRead ? "bg-muted/50 cursor-pointer hover:bg-muted" : "bg-card hover:bg-muted/30"
      )}
    >
      <Avatar className="h-10 w-10 border">
        <AvatarFallback className="bg-primary/10 text-primary text-xs">
          {initials}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 space-y-2 min-w-0">
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
              <span className="h-2 w-2 rounded-full bg-[#25D366] flex-shrink-0 animate-pulse" />
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

        <div className="flex items-center justify-between mt-1">
          {message.waInstance ? (
            <div className="text-[10px] text-muted-foreground">
              Instância: {message.waInstance.instanceName}
            </div>
          ) : <div />}

          {!showReply && !replySuccess && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setShowReply(true);
              }}
              className="h-6 px-2 text-xs text-muted-foreground hover:text-[#25D366] hover:bg-[#25D366]/10 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Reply className="w-3 h-3 mr-1" />
              Responder
            </Button>
          )}
        </div>

        {showReply && (
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleSendReply}
            className="mt-3 bg-background/50 border border-[#25D366]/20 rounded-md p-3 space-y-3"
          >
            <Textarea
              placeholder="Digite sua resposta..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              className="min-h-[80px] bg-background border-input resize-y text-sm focus-visible:ring-[#25D366]/50"
              disabled={replySending}
            />
            
            {replyError && (
              <div className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {replyError}
              </div>
            )}
            
            <div className="flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowReply(false)}
                disabled={replySending}
                className="text-xs h-7 hover:bg-destructive/10 hover:text-destructive"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={!replyText.trim() || replySending}
                className="text-xs h-7 bg-[#25D366]/10 text-[#25D366] border border-[#25D366]/20 hover:bg-[#25D366]/20"
              >
                {replySending ? (
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                ) : (
                  <Reply className="w-3 h-3 mr-1" />
                )}
                {replySending ? "Enviando..." : "Enviar"}
              </Button>
            </div>
          </form>
        )}

        {replySuccess && (
          <div className="mt-2 text-xs text-[#25D366] flex items-center gap-1 bg-[#25D366]/10 py-1.5 px-3 rounded-md w-fit">
            <CheckCircle2 className="w-3 h-3" />
            Resposta enviada!
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
