"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { format } from "date-fns";
import { X, CalendarIcon, ClipboardList, CheckCircle2 } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";
import { ProgramRecord } from "./ProgramTable";
import IconButton from "@/components/ui/IconButton";

interface EditProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  record: ProgramRecord | null;
}

// ─── Shared UI Helpers ───────────────────────────────────────────────────────

type FieldProps = {
  label: string;
  id: string;
  children: React.ReactNode;
};

function Field({ label, id, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5 text-left">
      <label htmlFor={id} className="text-xs font-semibold uppercase tracking-wide text-slate-600 font-lexend">
        {label}
      </label>
      <div className="relative">
        {children}
      </div>
    </div>
  );
}

const inputClass = "flex w-full cursor-pointer items-center justify-between rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm outline-none transition hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-teal-500";

export default function EditProgressModal({ isOpen, onClose, onSave, record }: EditProgressModalProps) {
  const [localRecord, setLocalRecord] = useState<ProgramRecord | null>(null);
  const [status, setStatus] = useState<ProgramRecord["status"]>("Ongoing");
  const [endDate, setEndDate] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (record) {
      setLocalRecord(record);
      setStatus(record.status);
      setEndDate(record.endDate === "N/A" ? "" : record.endDate);
    }
  }, [record]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => { document.body.style.overflow = "unset"; };
  }, [isOpen]);

  const handleStatusChange = (newStatus: ProgramRecord["status"]) => {
    setStatus(newStatus);
    if (newStatus === "Completed") {
      setEndDate(format(new Date(), "yyyy-MM-dd"));
    } else {
      setEndDate("");
    }
  };

  const handleSave = async () => {
    if (!localRecord) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("inmate_programs")
        .update({
          progress: status,
          end_date: endDate || null,
        })
        .eq("inmate_program_id", parseInt(localRecord.id));

      if (error) throw error;

      toast.success("Progress updated successfully!");
      onSave();
      onClose();
    } catch (err: unknown) {
      console.error("Update error:", err);
      toast.error(`Failed to update progress: ${(err as Error).message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && localRecord && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
        >
          <motion.div
            className="relative flex w-full max-w-lg flex-col rounded-2xl bg-white shadow-2xl overflow-hidden"
            initial={{ opacity: 0, scale: 0.94, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 24 }}
            transition={{ type: "spring", duration: 0.38, bounce: 0.18 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b bg-teal-700 px-6 py-4 text-white">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
                  <ClipboardList size={22} className="text-white" />
                </div>
                <div>
                  <p className="font-lexend text-lg font-semibold leading-tight text-left text-white">Edit Progress</p>
                  <p className="text-[10px] text-teal-100 flex items-center gap-1.5 mt-0.5 uppercase tracking-wider font-medium text-left">
                    Inmate: {localRecord.inmateName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full p-2 text-white/80 transition hover:bg-white/20 hover:text-white cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-8 space-y-6">
              {/* Program Info (ReadOnly) */}
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 text-left">Current Program</p>
                <p className="font-lexend font-semibold text-slate-800 text-left">{localRecord.program}</p>
              </div>

              {/* Status Select Buttons */}
              <Field label="Progress Status" id="progress_status">
                <div className="grid grid-cols-3 gap-3">
                  {(["Ongoing", "Completed", "Dropped"] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => handleStatusChange(s)}
                      className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 py-3 transition-all cursor-pointer ${
                        status === s
                          ? "border-teal-600 bg-teal-50 text-teal-700 shadow-sm scale-[1.02]"
                          : "border-slate-100 bg-white text-slate-500 hover:border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <span className="text-sm font-semibold">{s}</span>
                    </button>
                  ))}
                </div>
              </Field>

              {/* End Date Picker */}
              <Field label="End Date (Optional)" id="end_date">
                <DatePickerField
                  id="end_date"
                  value={endDate}
                  onSelect={(date) => setEndDate(date ? format(date, "yyyy-MM-dd") : "")}
                />
                <p className="text-[10px] text-slate-400 mt-1.5 text-left">
                  The date when this program phase ended. Auto-filled if set to &quot;Completed&quot;.
                </p>
              </Field>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 border-t bg-slate-50 px-6 py-4">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <IconButton
                onClick={handleSave}
                icon={<CheckCircle2 size={18} />}
                colorClass="bg-teal-700 hover:bg-teal-800 text-white"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Updating..." : "Update Progress"}
              </IconButton>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function DatePickerField({ id, value, onSelect }: { id: string; value: string; onSelect: (date: Date | undefined) => void }) {
  const selected = value ? new Date(value + "T12:00:00") : undefined;
  return (
    <div className="w-full">
      <Popover>
        <PopoverTrigger id={id} className={inputClass}>
          <span className={selected ? "text-slate-800 font-medium" : "text-slate-500"}>
            {selected ? format(selected, "dd/MM/yyyy") : "dd/mm/yyyy"}
          </span>
          <CalendarIcon className="size-4 shrink-0 text-slate-400" />
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selected}
            onSelect={onSelect}
            className="[&_button]:cursor-pointer"
            fromYear={2000}
            toYear={2100}
            captionLayout="dropdown"
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
