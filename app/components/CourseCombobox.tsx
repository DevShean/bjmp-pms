"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { ChevronsUpDown, Check, Search } from "lucide-react";

const COURSE_OPTIONS = [
  "Criminology",
  "Psychology",
  "Social Work",
  "Education",
  "Nursing",
  "Information Technology",
  "Business Administration",
  "Accountancy",
  "Agriculture",
  "Engineering",
  "English",
  "Political Science",
  "High School",
  "Elementary",
  "Others"
];

type CourseComboboxProps = {
  value: string;
  onValueChange: (val: string) => void;
  placeholder?: string;
};

export default function CourseCombobox({ value, onValueChange, placeholder = "Select or type course" }: CourseComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const norm = query.trim().toLowerCase();
    if (!norm) return COURSE_OPTIONS;
    return COURSE_OPTIONS.filter(opt => opt.toLowerCase().includes(norm));
  }, [query]);

  // Close on outside click
  // Close on outside click
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!containerRef.current) return;
      if (containerRef.current.contains(e.target as Node)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="cursor-pointer flex w-full items-center justify-between rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none ring-teal-500 placeholder:text-slate-400 focus:ring-2 focus:border-teal-500 transition"
        aria-expanded={open}
        aria-label="Select course"
      >
        <span className="truncate font-medium text-slate-700">{value || <span className="text-slate-400">{placeholder}</span>}</span>
        <ChevronsUpDown className="h-4 w-4 shrink-0 text-slate-400" />
      </button>
      {open && (
        <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl">
          <div className="border-b border-slate-100 p-2">
            <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-sm text-slate-600 focus-within:border-blue-300 focus-within:bg-white">
              <Search className="h-4 w-4" />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search or type course"
                className="w-full bg-transparent outline-none"
                onKeyDown={e => {
                  if (e.key === "Enter" && query) {
                    onValueChange(query);
                    setOpen(false);
                  }
                }}
              />
            </label>
          </div>
          <div className="max-h-64 overflow-y-auto p-2">
            {filtered.length === 0 && (
              <button
                type="button"
                className="w-full rounded px-2 py-2 text-left text-sm text-slate-500 hover:bg-slate-100"
                onClick={() => { onValueChange(query); setOpen(false); }}
              >
                Add &quot;{query}&quot;
              </button>
            )}
            {filtered.map(opt => (
              <button
                type="button"
                key={opt}
                onClick={() => { onValueChange(opt); setOpen(false); }}
                className="cursor-pointer flex w-full items-center justify-between rounded-lg px-2 py-2 text-left transition hover:bg-slate-50"
              >
                <span className="block text-sm font-medium text-slate-700">{opt}</span>
                <Check className={"h-4 w-4 text-blue-600 " + (value === opt ? "opacity-100" : "opacity-0")} />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
