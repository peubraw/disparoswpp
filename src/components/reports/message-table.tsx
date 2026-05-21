"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { MessageStatus } from "@prisma/client";

type Message = {
  id: string;
  contactPhone: string;
  status: string;
  sentAt: Date | string | null;
  errorMessage: string | null;
};

type MessageTableProps = {
  messages: Message[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
};

const FILTERS = ["ALL", "PENDING", "SENT", "DELIVERED", "READ", "FAILED"];

export function MessageTable({ messages, pagination }: MessageTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentStatus = searchParams.get("status") || "ALL";

  const createQueryString = (name: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(name, value);
    if (name === "status") {
      params.set("page", "1");
    }
    return params.toString();
  };

  const handlePageChange = (newPage: number) => {
    router.push(`${pathname}?${createQueryString("page", newPage.toString())}`, { scroll: false });
  };

  const handleStatusChange = (status: string) => {
    router.push(`${pathname}?${createQueryString("status", status)}`, { scroll: false });
  };

  const handleExportCSV = () => {
    const csvContent = [
      ["Telefone", "Status", "Data de Envio", "Erro"],
      ...messages.map((m) => [
        m.contactPhone,
        m.status,
        m.sentAt ? new Date(m.sentAt).toISOString() : "",
        m.errorMessage ? `"${m.errorMessage.replace(/"/g, '""')}"` : "",
      ]),
    ]
      .map((e) => e.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `relatorio_mensagens_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((status) => (
            <Button
              key={status}
              variant={currentStatus === status ? "default" : "outline"}
              size="sm"
              onClick={() => handleStatusChange(status)}
            >
              {status === "ALL" ? "Todos" : status}
            </Button>
          ))}
        </div>
        <Button onClick={handleExportCSV} variant="secondary">
          Exportar CSV (Página Atual)
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Telefone</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Data de Envio</TableHead>
              <TableHead>Erro</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {messages.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground h-24">
                  Nenhuma mensagem encontrada.
                </TableCell>
              </TableRow>
            ) : (
              messages.map((msg) => (
                <TableRow key={msg.id}>
                  <TableCell className="font-mono text-sm">{msg.contactPhone}</TableCell>
                  <TableCell>
                    <StatusBadge status={msg.status as MessageStatus} />
                  </TableCell>
                  <TableCell>
                    {msg.sentAt
                      ? format(new Date(msg.sentAt), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })
                      : "-"}
                  </TableCell>
                  <TableCell className="text-red-500 max-w-[200px] truncate" title={msg.errorMessage || undefined}>
                    {msg.errorMessage || "-"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {pagination.totalPages > 1 && (
        <div className="flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            Página {pagination.page} de {pagination.totalPages} ({pagination.totalItems} itens)
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => handlePageChange(pagination.page - 1)}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => handlePageChange(pagination.page + 1)}
            >
              Próxima
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
