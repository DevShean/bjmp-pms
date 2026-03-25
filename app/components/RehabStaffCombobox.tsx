"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

type Staff = {
  id: string;
  name: string;
  email: string;
};

type RehabStaffComboboxProps = {
  value: string;
  onValueChange: (staffName: string) => void;
};

function cn(...classNames: Array<string | false | null | undefined>) {
  return classNames.filter(Boolean).join(" ");
}

export default function RehabStaffCombobox({ value, onValueChange }: RehabStaffComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchStaff() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("users")
          .select("user_id, username, email")
          .eq("role_id", 4);

        if (error) throw error;

        if (data) {
          const formatted = data.map(u => ({
            id: u.user_id.toString(),
            name: u.username,
            email: u.email
          }));
          setStaff(formatted);
        }
      } catch (err) {
        console.error("Error fetching rehab staff:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchStaff();
  }, []);

  useEffect(() => {
    function onOutsideClick(event: MouseEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", onOutsideClick);
    return () => document.removeEventListener("mousedown", onOutsideClick);
  }, []);

  const selectedStaff = useMemo(() => staff.find((item) => item.id === value), [staff, value]);

  const filteredStaff = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return staff;

    return staff.filter((item) => {
      return (
        item.name.toLowerCase().includes(normalized) ||
        item.email.toLowerCase().includes(normalized)
      );
    });
  }, [query, staff]);

  return (
    <div className="relative w-full" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full cursor-pointer items-center justify-between rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-teal-500 focus:ring-2 ring-teal-500"
        aria-expanded={open}
      >
        <span className="truncate">
          {selectedStaff ? selectedStaff.name : (value || "Select staff")}
        </span>
        <ChevronsUpDown className="h-4 w-4 shrink-0 text-slate-400" />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg animate-in fade-in zoom-in duration-200">
          <div className="border-b border-slate-100 p-2">
            <div className="flex items-center gap-2 rounded-md bg-slate-50 px-2 py-1.5 focus-within:ring-1 ring-teal-500 transition">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search staff..."
                className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                autoFocus
              />
            </div>
          </div>

          <div className="max-h-60 overflow-y-auto p-1">
            {loading ? (
              <p className="px-3 py-2 text-sm text-slate-500">Loading staff...</p>
            ) : filteredStaff.length === 0 ? (
              <p className="px-3 py-2 text-sm text-slate-500">No staff found.</p>
            ) : (
              filteredStaff.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => {
                    onValueChange(item.id);
                    setOpen(false);
                  }}
                  className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition hover:bg-slate-50"
                >
                  <div className="flex flex-col">
                    <span className="font-medium text-slate-700">{item.name}</span>
                    <span className="text-xs text-slate-400">{item.email}</span>
                  </div>
                  <Check className={cn("h-4 w-4 text-teal-600", value === item.id ? "opacity-100" : "opacity-0")} />
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
