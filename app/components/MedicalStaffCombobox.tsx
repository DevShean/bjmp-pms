"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";

type MedicalStaff = {
  id: string;
  name: string;
  role: string;
};

const DUMMY_STAFF: MedicalStaff[] = [
  { id: "MS-001", name: "Dr. Sarah Johnson", role: "Physician" },
  { id: "MS-002", name: "Dr. Mark Wilson", role: "Psychiatrist" },
  { id: "MS-003", name: "Nurse Emily Davis", role: "Registered Nurse" },
  { id: "MS-004", name: "Nurse John Smith", role: "Head Nurse" },
];

type MedicalStaffComboboxProps = {
  value: string;
  onValueChange: (staffId: string) => void;
};

function cn(...classNames: Array<string | false | null | undefined>) {
  return classNames.filter(Boolean).join(" ");
}

export default function MedicalStaffCombobox({ value, onValueChange }: MedicalStaffComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onOutsideClick(event: MouseEvent) {
      if (!containerRef.current) {
        return;
      }
      if (!containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", onOutsideClick);
    return () => document.removeEventListener("mousedown", onOutsideClick);
  }, []);

  const selectedStaff = useMemo(() => DUMMY_STAFF.find((item) => item.id === value), [value]);

  const filteredStaff = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return DUMMY_STAFF;
    }

    return DUMMY_STAFF.filter((item) => {
      return (
        item.name.toLowerCase().includes(normalized) ||
        item.id.toLowerCase().includes(normalized) ||
        item.role.toLowerCase().includes(normalized)
      );
    });
  }, [query]);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="cursor-pointer flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left text-sm shadow-sm outline-none transition hover:border-blue-300 focus:ring-2 focus:ring-blue-200"
        aria-expanded={open}
      >
        <span className="flex min-w-0 items-center gap-2">
          {selectedStaff ? (
            <span className="truncate font-medium text-slate-700">{selectedStaff.name}</span>
          ) : (
            <span className="text-slate-500">Select Medical Staff</span>
          )}
        </span>
        <ChevronsUpDown className="h-4 w-4 shrink-0 text-slate-400" />
      </button>

      {open && (
        <div className="absolute z-100 mt-2 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
          <div className="border-b border-slate-100 p-2">
            <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-sm text-slate-600 focus-within:border-blue-300 focus-within:bg-white">
              <Search className="h-4 w-4" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search staff..."
                className="w-full bg-transparent outline-none"
              />
            </label>
          </div>

          <div className="max-h-64 overflow-y-auto p-2">
            {filteredStaff.length === 0 && (
              <p className="px-2 py-4 text-sm text-slate-500">No staff found.</p>
            )}

            {filteredStaff.map((item) => (
              <button
                type="button"
                key={item.id}
                onClick={() => {
                  onValueChange(item.id);
                  setOpen(false);
                }}
                className="cursor-pointer flex w-full items-center justify-between rounded-lg px-2 py-2 text-left transition hover:bg-slate-50"
              >
                <span>
                  <span className="block text-sm font-medium text-slate-700">{item.name}</span>
                  <span className="block text-xs text-slate-500">
                    {item.role}
                  </span>
                </span>
                <Check className={cn("h-4 w-4 text-blue-600", value === item.id ? "opacity-100" : "opacity-0")} />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
