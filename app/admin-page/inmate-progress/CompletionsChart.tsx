"use client";

import { useEffect, useRef } from "react";
import { BarChart3 } from "lucide-react";

interface CompletionsChartProps {
  data: Array<{ month: string; completions: number }>;
}

export default function CompletionsChart({ data }: CompletionsChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const padding = { top: 20, right: 20, bottom: 40, left: 50 };
    const chartWidth = rect.width - padding.left - padding.right;
    const chartHeight = rect.height - padding.top - padding.bottom;

    const maxValue = Math.max(...data.map((d) => d.completions), 1);
    const barWidth = chartWidth / data.length * 0.5;
    const gap = chartWidth / data.length * 0.5;

    // Clear canvas with light grey background
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(0, 0, rect.width, rect.height);

    // Draw grid lines (horizontal)
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 1;
    const gridLines = 5;
    for (let i = 0; i <= gridLines; i++) {
      const y = padding.top + (chartHeight / gridLines) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(padding.left + chartWidth, y);
      ctx.stroke();
    }

    // Draw axes
    ctx.strokeStyle = "#64748b";
    ctx.lineWidth = 2;
    // Y axis
    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top);
    ctx.lineTo(padding.left, padding.top + chartHeight);
    ctx.stroke();
    // X axis
    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top + chartHeight);
    ctx.lineTo(padding.left + chartWidth, padding.top + chartHeight);
    ctx.stroke();

    // Draw Y-axis labels (0 to max)
    ctx.fillStyle = "#64748b";
    ctx.font = "12px sans-serif";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    for (let i = 0; i <= gridLines; i++) {
      const value = Math.round(maxValue - (maxValue / gridLines) * i);
      const y = padding.top + (chartHeight / gridLines) * i;
      ctx.fillText(String(value), padding.left - 8, y);
    }

    // Draw bars
    data.forEach((item, index) => {
      const x = padding.left + index * (barWidth + gap) + gap / 2;
      const barHeight = (item.completions / maxValue) * chartHeight;
      const y = padding.top + chartHeight - barHeight;

      // Draw bar
      ctx.fillStyle = "#3b82f6";
      ctx.fillRect(x, y, barWidth, barHeight);

      // Draw month label
      ctx.fillStyle = "#64748b";
      ctx.font = "12px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(item.month, x + barWidth / 2, padding.top + chartHeight + 15);
    });

    // Draw legend at top right
    const legendX = padding.left + chartWidth - 100;
    const legendY = padding.top - 10;
    ctx.fillStyle = "white";
    ctx.fillRect(legendX - 8, legendY - 8, 100, 24);
    ctx.strokeStyle = "#3b82f6";
    ctx.lineWidth = 2;
    ctx.strokeRect(legendX - 8, legendY - 8, 100, 24);
    ctx.fillStyle = "#1e293b";
    ctx.font = "12px sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText("Completions", legendX + 4, legendY + 4);

  }, [data]);

  return (
    <div className="min-w-0 flex-1 overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-2">
        <BarChart3 className="h-5 w-5 text-slate-600" />
        <h2 className="font-lexend text-lg font-semibold text-slate-800">Monthly Completions</h2>
      </div>
      <div className="mt-4 relative h-64 w-full">
        <canvas
          id="completionsChart"
          ref={canvasRef}
          className="h-full w-full"
        />
      </div>
    </div>
  );
}