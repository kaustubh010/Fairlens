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
import type { GroupMetrics } from "@/lib/types";

interface FairnessChartProps {
  data: GroupMetrics[];
  metric: "selectionRate" | "truePositiveRate" | "falsePositiveRate";
  title: string;
  threshold?: number;
}

export function FairnessChart({ data, metric, title, threshold }: FairnessChartProps) {
  const chartData = data.map((group) => ({
    name: group.groupName,
    value: group[metric] * 100,
    count: group.count,
  }));

  const maxValue = Math.max(...chartData.map((d) => d.value));
  const referenceGroup = data.find((g) => g.isReference);
  const referenceValue = referenceGroup ? referenceGroup[metric] * 100 : null;

  return (
    <div className="w-full">
      <h4 className="text-sm font-medium text-muted-foreground mb-3">{title}</h4>
      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ left: 80, right: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
            <XAxis
              type="number"
              domain={[0, Math.max(100, maxValue + 10)]}
              tickFormatter={(v) => `${v.toFixed(0)}%`}
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
              formatter={(value: number) => [`${value.toFixed(2)}%`, title]}
              labelFormatter={(label) => `Group: ${label}`}
            />
            {referenceValue !== null && (
              <ReferenceLine
                x={referenceValue}
                stroke="hsl(var(--primary))"
                strokeDasharray="5 5"
                label={{
                  value: "Reference",
                  position: "top",
                  fill: "hsl(var(--primary))",
                  fontSize: 10,
                }}
              />
            )}
            {threshold !== undefined && (
              <ReferenceLine
                x={threshold * 100}
                stroke="hsl(var(--warning))"
                strokeDasharray="3 3"
              />
            )}
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {chartData.map((entry, index) => {
                const isReference = data[index]?.isReference;
                return (
                  <Cell
                    key={`cell-${index}`}
                    fill={isReference ? "hsl(var(--primary))" : "hsl(var(--chart-2))"}
                  />
                );
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
