"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type MessagesChartProps = {
  data: Array<{
    date: string;
    sent: number;
    delivered: number;
  }>;
};

export function MessagesChart({ data }: MessagesChartProps) {
  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle>Envios vs Entregas (Últimos 7 dias)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="sent" name="Enviadas" stroke="#3b82f6" activeDot={{ r: 8 }} />
              <Line type="monotone" dataKey="delivered" name="Entregues" stroke="#22c55e" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
