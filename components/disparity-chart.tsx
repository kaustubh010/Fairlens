"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from "recharts";
import type { DisparityResult } from "@/lib/types";

interface DisparityChartProps {
  data: DisparityResult[];
  title: string;
}

export function DisparityChart({ data, title }: DisparityChartProps) {
  const chartData = data.map((d) => ({
    name: d.comparedGroup,
    ratio: d.ratio,
    passes: d.passes,
    difference: d.difference * 100,
  }));

  return (
    <div className="w-full">
      <h4 className="text-sm font-medium text-muted-foreground mb-3">{title}</h4>
      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ left: 80, right: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
            <XAxis
              type="number"
              domain={[0, "auto"]}
              tickFormatter={(v) => v.toFixed(2)}
              stroke="hsl(var(--muted-foreground))"
              fontSize={11}
            />
            <YAxis
              type="category"
              dataKey="name"
              stroke="hsl(var(--muted-foreground))"
              fontSize={11}
              width={75}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                color: "hsl(var(--foreground))",
              }}
              formatter={(value: number, name: string) => {
                if (name === "ratio") return [value.toFixed(3), "Disparity Ratio"];
                return [value, name];
              }}
            />
            <ReferenceLine
              x={0.8}
              stroke="hsl(var(--warning))"
              strokeDasharray="5 5"
              label={{
                value: "0.8 threshold",
                position: "top",
                fill: "hsl(var(--warning))",
                fontSize: 10,
              }}
            />
            <ReferenceLine
              x={1.0}
              stroke="hsl(var(--success))"
              strokeDasharray="3 3"
            />
            <Bar dataKey="ratio" radius={[0, 4, 4, 0]}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.passes ? "hsl(var(--success))" : "hsl(var(--destructive))"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
