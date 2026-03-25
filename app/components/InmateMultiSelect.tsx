"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronsUpDown, Search, User, X } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

type Inmate = {
  id: string;
  dbId: number;
  name: string;
};

type InmateMultiSelectProps = {
  selectedIds: string[];
  onValueChange: (ids: string[]) => void;
  placeholder?: string;
};

function cn(...classNames: Array<string | false | null | undefined>) {
  return classNames.filter(Boolean).join(" ");
}

export default function InmateMultiSelect({ 
  selectedIds, 
  onValueChange, 
  placeholder = "Select Inmates" 
}: InmateMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [inmates, setInmates] = useState<Inmate[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadInmates() {
      try {
        setLoading(true);
        
        // 1. Fetch inmates currently in an 'Ongoing' program
        const { data: enrolledData, error: enrolledError } = await supabase
          .from("inmate_programs")
          .select("inmate_id")
          .eq("progress", "Ongoing");

        if (enrolledError) throw enrolledError;
        
        const enrolledIds = new Set(enrolledData?.map(item => item.inmate_id) || []);

        // 2. Fetch all inmates
        const { data, error } = await supabase
          .from("inmates")
          .select("inmate_id, first_name, last_name")
          .order("last_name", { ascending: true });

        if (error) throw error;

        if (data) {
          // 3. Filter out those who are enrolled
          const formatted = data
            .filter(item => !enrolledIds.has(item.inmate_id))
            .map((item) => ({
              dbId: item.inmate_id,
              id: String(item.inmate_id),
              name: `${item.first_name} ${item.last_name}`,
            }));
          setInmates(formatted);
        }
      } catch (err) {
        console.error("Error loading inmates:", err);
      } finally {
        setLoading(false);
      }
    }

    loadInmates();
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

  const filteredInmates = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return inmates;
    return inmates.filter((item) => item.name.toLowerCase().includes(normalized));
  }, [inmates, query]);

  const toggleInmate = (id: string) => {
    const next = selectedIds.includes(id)
      ? selectedIds.filter((i) => i !== id)
      : [...selectedIds, id];
    onValueChange(next);
  };

  const removeInmate = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    onValueChange(selectedIds.filter((i) => i !== id));
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      <div 
        onClick={() => setOpen((prev) => !prev)}
        className="cursor-pointer min-h-[42px] flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-left text-sm shadow-sm transition hover:border-blue-300 focus-within:ring-2 ring-blue-500/20"
      >
        <div className="flex flex-wrap gap-1.5 flex-1 min-w-0 pr-2">
          {selectedIds.length === 0 ? (
            <span className="text-slate-500 py-1">{placeholder}</span>
          ) : (
            selectedIds.slice(0, 3).map((id) => {
              const inmate = inmates.find((i) => i.id === id);
              return (
                <span 
                  key={id} 
                  className="inline-flex items-center gap-1 rounded-md bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700 animate-in fade-in scale-95 duration-200"
                >
                  <span className="truncate max-w-[120px]">{inmate?.name || id}</span>
                  <X 
                    size={13} 
                    className="cursor-pointer hover:text-blue-900" 
                    onClick={(e) => removeInmate(e, id)} 
                  />
                </span>
              );
            })
          )}
          {selectedIds.length > 3 && (
            <span className="py-1 text-xs font-semibold text-slate-500">
              +{selectedIds.length - 3} more
            </span>
          )}
        </div>
        <ChevronsUpDown className="h-4 w-4 shrink-0 text-slate-400" />
      </div>

      {open && (
        <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="border-b border-slate-100 p-2">
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-sm text-slate-600 focus-within:border-blue-300 focus-within:bg-white transition-all">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search inmates..."
                className="w-full bg-transparent outline-none placeholder:text-slate-400"
                autoFocus
              />
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto p-1 custom-scrollbar">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
              </div>
            ) : filteredInmates.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-slate-500">No inmates found.</p>
            ) : (
              <div className="grid grid-cols-1 gap-0.5">
                {filteredInmates.map((item) => {
                  const isSelected = selectedIds.includes(item.id);
                  return (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => toggleInmate(item.id)}
                      className={cn(
                        "group flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition",
                        isSelected ? "bg-blue-50" : "hover:bg-slate-50"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "flex h-5 w-5 items-center justify-center rounded border transition-colors",
                          isSelected ? "bg-blue-600 border-blue-600 text-white" : "border-slate-300 group-hover:border-blue-400 bg-white"
                        )}>
                          {isSelected && <Check size={14} strokeWidth={3} />}
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                             <User size={16} />
                          </div>
                          <span className={cn("font-medium transition-colors", isSelected ? "text-blue-700" : "text-slate-700")}>
                            {item.name}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          
          {selectedIds.length > 0 && (
            <div className="border-t border-slate-100 bg-slate-50 p-2 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 px-1">
                {selectedIds.length} Selected
              </span>
              <button 
                type="button"
                onClick={() => onValueChange([])}
                className="text-xs font-bold text-rose-600 hover:text-rose-700 px-2 py-1 transition"
              >
                Clear All
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
