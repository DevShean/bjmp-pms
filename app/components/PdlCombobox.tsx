"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronsUpDown, Search, Lock } from "lucide-react";
import Image from "next/image";
import { supabase } from "@/lib/supabase/client";

import { getInmateImageUrl } from "@/app/lib/utils/image";

type Pdl = {
  id: string;
  name: string;
  imageUrl: string;
  unit: string;
  isAssigned?: boolean;
};

type PdlComboboxProps = {
  value: string;
  onValueChange: (pdlId: string) => void;
  placeholder?: string;
  showAll?: boolean;
};

function cn(...classNames: Array<string | false | null | undefined>) {
  return classNames.filter(Boolean).join(" ");
}

export default function PdlCombobox({ 
  value, 
  onValueChange, 
  placeholder = "Select a PDL",
  showAll = false
}: PdlComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [pdls, setPdls] = useState<Pdl[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadPdls() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("inmates")
          .select("inmate_id, first_name, last_name, photo_path, cell_block")
          .order("last_name", { ascending: true });

        if (error) {
          throw error;
        }

        const { data: medicalRecords, error: medicalError } = await supabase
          .from("medical_records")
          .select("inmate_id");

        if (medicalError) {
          console.error("Error fetching medical records:", medicalError);
        }

        const assignedInmateIds = new Set((medicalRecords || []).map((r) => String(r.inmate_id)));

        const formatted: Pdl[] = (data || []).map((item) => {
          const fullName = `${item.first_name} ${item.last_name}`;
          const inmateId = String(item.inmate_id);
          
          return {
            id: inmateId,
            name: fullName,
            imageUrl: getInmateImageUrl(item.photo_path, fullName),
            unit: item.cell_block || "Unassigned",
            isAssigned: assignedInmateIds.has(inmateId),
          };
        });

        if (isMounted) {
          setPdls(formatted);
        }
      } catch (err) {
        console.error("Error fetching PDL list:", err);
        if (isMounted) {
          setPdls([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadPdls();

    return () => {
      isMounted = false;
    };
  }, []);

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

  const selectedPdl = useMemo(() => pdls.find((item) => item.id === value), [pdls, value]);

  const filteredPdls = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return pdls;
    }

    return pdls.filter((item) => {
      return (
        item.name.toLowerCase().includes(normalized) ||
        item.id.toLowerCase().includes(normalized) ||
        item.unit.toLowerCase().includes(normalized)
      );
    });
  }, [pdls, query]);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="cursor-pointer flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left text-sm shadow-sm outline-none transition hover:border-blue-300 focus:ring-2 focus:ring-blue-200"
        aria-expanded={open}
        aria-label="Select PDL"
      >
        <span className="flex min-w-0 items-center gap-2">
          {selectedPdl ? (
            <>
              <div className="relative h-7 w-7 shrink-0">
                <Image
                  src={selectedPdl.imageUrl}
                  alt={selectedPdl.name}
                  fill
                  sizes="28px"
                  className="rounded-full border border-slate-200 object-cover"
                  unoptimized={selectedPdl.imageUrl.startsWith("data:")}
                />
              </div>
              <span className="truncate font-medium text-slate-700">{selectedPdl.name}</span>
            </>
          ) : (
            <span className="text-slate-500">{placeholder}</span>
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
                placeholder="Search PDL name, id, or unit"
                className="w-full bg-transparent outline-none"
              />
            </label>
          </div>

          <div className="max-h-64 overflow-y-auto p-2">
            {loading && <p className="px-2 py-4 text-sm text-slate-500">Loading PDL list...</p>}

            {!loading && filteredPdls.length === 0 && (
              <p className="px-2 py-4 text-sm text-slate-500">No PDL found.</p>
            )}

            {!loading &&
              filteredPdls.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  disabled={!showAll && item.isAssigned}
                  onClick={() => {
                    onValueChange(item.id);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center justify-between rounded-lg px-2 py-2 text-left transition",
                    (!showAll && item.isAssigned) ? "opacity-50 cursor-not-allowed bg-slate-200/50" : "cursor-pointer hover:bg-slate-50"
                  )}
                >
                  <span className="flex items-center gap-2">
                    <div className="relative h-8 w-8 shrink-0">
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        fill
                        sizes="32px"
                        className="rounded-full border border-slate-200 object-cover"
                        unoptimized={item.imageUrl.startsWith("data:")}
                      />
                    </div>
                    <span>
                      <span className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                        {item.name}
                        {item.isAssigned && (
                          <Lock className="h-3 w-3 text-slate-400" />
                        )}
                      </span>
                      <span className="block text-xs text-slate-500">
                        {item.id} • {item.unit}
                      </span>
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
