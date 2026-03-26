"use client";

interface CompletionsChartProps {
  data: Array<{
    month: string;
    completions: number;
  }>;
}

export default function CompletionsChart({ data }: CompletionsChartProps) {
  const maxValue = Math.max(...data.map((d) => d.completions), 1);

  const chartHeight = 200;
  const chartWidth = 400;
  const padding = 40;
  const innerWidth = chartWidth - padding * 2;
  const innerHeight = chartHeight - padding * 2;

  const points = data.map((item, index) => {
    const x = padding + (index / (data.length - 1)) * innerWidth;
    const y = padding + innerHeight - (item.completions / maxValue) * innerHeight;
    return `${x},${y}`;
  }).join(" ");

  const monthLabels = data.map((item, index) => {
    const x = padding + (index / (data.length - 1)) * innerWidth;
    return { month: item.month, x };
  });

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="font-lexend text-lg font-semibold text-slate-800">Monthly Completions</h2>
      <div className="mt-4 overflow-x-auto">
        <svg width={chartWidth} height={chartHeight} className="min-w-400px">
          {/* Grid lines */}
          {[0, 1, 2, 3, 4].map((i) => {
            const y = padding + innerHeight - (i / 4) * innerHeight;
            return (
              <g key={i}>
                <line
                  x1={padding}
                  y1={y}
                  x2={chartWidth - padding}
                  y2={y}
                  stroke="#e2e8f0"
                  strokeWidth="1"
                />
                <text
                  x={padding - 10}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-slate-500 text-xs"
                >
                  {Math.round((i / 4) * maxValue)}
                </text>
              </g>
            );
          })}

          {/* Line */}
          <polyline
            points={points}
            fill="none"
            stroke="#0ea5e9"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data points */}
          {data.map((item, index) => {
            const x = padding + (index / (data.length - 1)) * innerWidth;
            const y = padding + innerHeight - (item.completions / maxValue) * innerHeight;
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r="5"
                fill="#0ea5e9"
                stroke="white"
                strokeWidth="2"
              />
            );
          })}

          {/* Month labels */}
          {monthLabels.map((label, index) => (
            <text
              key={index}
              x={label.x}
              y={chartHeight - 10}
              textAnchor="middle"
              className="fill-slate-600 text-xs"
            >
              {label.month}
            </text>
          ))}
        </svg>
      </div>
    </div>
  );
}