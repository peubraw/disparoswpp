"use client";

import { useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type DeliveryChartProps = {
  data: Array<{
    status: string;
    sentAt: Date | string | null;
  }>;
};

export function DeliveryChart({ data }: DeliveryChartProps) {
  const chartData = useMemo(() => {
    if (!data.length) return [];

    const messagesWithTime = data.filter((m) => m.sentAt) as Array<{ status: string; sentAt: Date | string }>;
    
    if (!messagesWithTime.length) return [];

    messagesWithTime.sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime());

    const buckets = new Map<string, { time: string; timestamp: number; sent: number; delivered: number; read: number }>();

    for (const msg of messagesWithTime) {
      const d = new Date(msg.sentAt);
      d.setSeconds(0, 0);
      const key = d.toISOString();
      
      if (!buckets.has(key)) {
        const timeLabel = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
        buckets.set(key, { time: timeLabel, timestamp: d.getTime(), sent: 0, delivered: 0, read: 0 });
      }
      
      const bucket = buckets.get(key)!;
      if (msg.status === "SENT" || msg.status === "DELIVERED" || msg.status === "READ") bucket.sent++;
      if (msg.status === "DELIVERED" || msg.status === "READ") bucket.delivered++;
      if (msg.status === "READ") bucket.read++;
    }

    const sortedBuckets = Array.from(buckets.values()).sort((a, b) => a.timestamp - b.timestamp);

    let cumulativeSent = 0;
    let cumulativeDelivered = 0;
    let cumulativeRead = 0;

    return sortedBuckets.map((bucket) => {
      cumulativeSent += bucket.sent;
      cumulativeDelivered += bucket.delivered;
      cumulativeRead += bucket.read;
      
      return {
        time: bucket.time,
        sent: cumulativeSent,
        delivered: cumulativeDelivered,
        read: cumulativeRead,
      };
    });
  }, [data]);

  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle>Evolução de Entregas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          {chartData.length === 0 ? (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              Sem dados suficientes para o gráfico
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="sent" name="Enviadas" stroke="#3b82f6" fillOpacity={0.1} fill="#3b82f6" />
                <Area type="monotone" dataKey="delivered" name="Entregues" stroke="#22c55e" fillOpacity={0.1} fill="#22c55e" />
                <Area type="monotone" dataKey="read" name="Lidas" stroke="#a855f7" fillOpacity={0.1} fill="#a855f7" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
