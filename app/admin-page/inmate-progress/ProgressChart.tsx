"use client";

import { useEffect, useRef } from "react";
import { PieChart } from "lucide-react";

interface ProgressChartProps {
  ongoing: number;
  completed: number;
  dropped: number;
}

export default function ProgressChart({ ongoing, completed, dropped }: ProgressChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const total = ongoing + completed + dropped;
    if (total === 0) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const radius = Math.min(centerX, centerY) - 20;

    const segments = [
      { value: ongoing, color: "#eab308", label: "Ongoing" },
      { value: completed, color: "#22c55e", label: "Completed" },
      { value: dropped, color: "#ef4444", label: "Dropped" },
    ];

    let currentAngle = -Math.PI / 2;
    segments.forEach((segment) => {
      if (segment.value === 0) return;
      const sliceAngle = (segment.value / total) * 2 * Math.PI;
      
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
      ctx.closePath();
      ctx.fillStyle = segment.color;
      ctx.fill();
      
      currentAngle += sliceAngle;
    });

  }, [ongoing, completed, dropped]);

  const total = ongoing + completed + dropped;

  const segments = [
    { label: "Ongoing", value: ongoing, color: "#eab308" },
    { label: "Completed", value: completed, color: "#22c55e" },
    { label: "Dropped", value: dropped, color: "#ef4444" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <PieChart className="h-5 w-5 text-slate-600" />
        <h2 className="font-lexend text-sm font-semibold text-slate-700">Progress Distribution</h2>
      </div>
      <div className="mt-6 flex items-start gap-8">
        <div className="flex-1">
          <div className="relative h-48 w-full">
            <canvas
              id="progressChart"
              ref={canvasRef}
              className="h-full w-full"
            />
            {total === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-sm text-slate-400">No data available</p>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-6 border-t border-slate-100 pt-4">
        {segments.map((segment, index) => (
          <div key={index} className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: segment.color }} />
            <span className="text-sm text-slate-600">{segment.label}</span>
            <span className="text-sm font-semibold text-slate-900">{segment.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}