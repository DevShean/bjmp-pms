"use client";

interface StatCardProps {
  title: string;
  value: number;
  tone: string;
}

export default function StatCard({ title, value, tone }: StatCardProps) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
      <p className="text-sm text-slate-500">{title}</p>
      <p className={`mt-2 text-4xl font-semibold ${tone}`}>{value}</p>
    </article>
  );
}
