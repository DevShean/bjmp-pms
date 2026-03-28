"use client";

import { useEffect, useRef } from "react";
import { BarChart3 } from "lucide-react";

interface BehaviorDistributionChartProps {
  data: {
    excellent: number;
    good: number;
    fair: number;
    poor: number;
  };
}

export default function BehaviorDistributionChart({ data }: BehaviorDistributionChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const entries = [
      { label: "Excellent", value: data.excellent, color: "#0f766e" }, // Teal-700
      { label: "Good", value: data.good, color: "#1d4ed8" }, // Blue-700
      { label: "Fair", value: data.fair, color: "#c2410c" }, // Orange-700
      { label: "Poor", value: data.poor, color: "#be123c" }, // Rose-700
    ];

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const padding = { top: 20, right: 20, bottom: 40, left: 40 };
    const chartWidth = rect.width - padding.left - padding.right;
    const chartHeight = rect.height - padding.top - padding.bottom;

    const maxValue = Math.max(...entries.map((d) => d.value), 1);
    const barWidth = (chartWidth / entries.length) * 0.5;
    const gap = (chartWidth / entries.length) * 0.5;

    // Clear canvas
    ctx.clearRect(0, 0, rect.width, rect.height);

    // Draw grid lines
    ctx.strokeStyle = "#f1f5f9";
    ctx.lineWidth = 1;
    const gridLines = 5;
    for (let i = 0; i <= gridLines; i++) {
      const y = padding.top + (chartHeight / gridLines) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(padding.left + chartWidth, y);
      ctx.stroke();
    }

    // Draw Y labels
    ctx.fillStyle = "#94a3b8";
    ctx.font = "10px sans-serif";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    for (let i = 0; i <= gridLines; i++) {
      const val = (maxValue / gridLines) * (gridLines - i);
      const y = padding.top + (chartHeight / gridLines) * i;
      ctx.fillText(Math.round(val).toString(), padding.left - 8, y);
    }

    // Draw bars
    entries.forEach((item, index) => {
      const x = padding.left + index * (barWidth + gap) + gap / 2;
      const barHeight = (item.value / maxValue) * chartHeight;
      const y = padding.top + chartHeight - barHeight;

      // Rounded bar top
      ctx.fillStyle = item.color;
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barHeight, [4, 4, 0, 0]);
      ctx.fill();

      // Label below
      ctx.fillStyle = "#64748b";
      ctx.font = "10px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(item.label, x + barWidth / 2, padding.top + chartHeight + 18);
    });
  }, [data]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-4 text-slate-800">
        <BarChart3 size={18} className="text-teal-600" />
        <h2 className="font-lexend text-lg font-semibold text-slate-800">Rating Distribution</h2>
      </div>
      <div className="relative h-60 w-full">
        <canvas ref={canvasRef} className="h-full w-full" />
      </div>
    </div>
  );
}
