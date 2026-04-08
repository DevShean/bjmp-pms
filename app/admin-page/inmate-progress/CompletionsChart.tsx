"use client";

import { BarChart3 } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface CompletionsChartProps {
  data: Array<{ month: string; completions: number }>;
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-lg">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</p>
      <p className="mt-0.5 text-sm font-bold text-teal-700">
        {payload[0].value} completion{payload[0].value !== 1 ? "s" : ""}
      </p>
    </div>
  );
}

export default function CompletionsChart({ data }: CompletionsChartProps) {
  const maxVal = Math.max(...data.map((d) => d.completions), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-slate-600" />
          <h2 className="font-lexend text-sm font-semibold text-slate-700">Monthly Completions</h2>
        </div>
        <span className="text-xs text-slate-400 font-medium">{new Date().getFullYear()}</span>
      </div>

      <div className="mt-5 h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barCategoryGap="35%" margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="#f1f5f9" strokeDasharray="4 0" />
            <XAxis
              dataKey="month"
              tick={{ fill: "#94a3b8", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fill: "#94a3b8", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f1f5f9", radius: 6 }} />
            <Bar dataKey="completions" radius={[6, 6, 0, 0]}>
              {data.map((entry, index) => (
                <Cell
                  key={index}
                  fill={entry.completions === maxVal && maxVal > 0 ? "#0d9488" : "#99f6e4"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-teal-600" />
          Peak month
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-teal-200" />
          Completions
        </span>
      </div>
    </div>
  );
}