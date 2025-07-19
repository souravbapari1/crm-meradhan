import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { SalesPerformance } from "@/types";

interface SalesChartProps {
  data?: SalesPerformance[];
}

export default function SalesChart({ data }: SalesChartProps) {
  // Transform data for the chart
  const chartData = data?.map((item, index) => ({
    period: `Week ${index + 1}`,
    current: parseFloat(item.amount),
    previous: parseFloat(item.amount) * 0.8, // Mock previous data
  })) || [];

  return (
    <Card className="card-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Sales Performance</CardTitle>
          <div className="flex gap-2">
            <Badge variant="secondary">
              <div className="w-2 h-2 rounded-full bg-primary mr-1" />
              Current Month
            </Badge>
            <Badge variant="outline">
              <div className="w-2 h-2 rounded-full bg-muted-foreground mr-1" />
              Previous Month
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="period" 
                className="fill-muted-foreground text-xs"
              />
              <YAxis 
                className="fill-muted-foreground text-xs"
                tickFormatter={(value) => `₹${value}Cr`}
              />
              <Tooltip 
                formatter={(value: number) => [`₹${value}Cr`, "Sales"]}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))' 
                }}
              />
              <Line 
                type="monotone" 
                dataKey="current" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--primary))' }}
              />
              <Line 
                type="monotone" 
                dataKey="previous" 
                stroke="hsl(var(--muted-foreground))" 
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ fill: 'hsl(var(--muted-foreground))' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
