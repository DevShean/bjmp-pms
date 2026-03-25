"use client";

import { useState, useEffect } from "react";
import IconButton from "@/components/ui/IconButton";
import { AnimatePresence, motion } from "motion/react";
import { X, Stethoscope, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import PdlCombobox from "../../components/PdlCombobox";
import MedicalStaffCombobox from "../../components/MedicalStaffCombobox";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";

interface AssignMedicalStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    inmateId: string;
    medicalStaffId: string;
    date: string;
  }) => void;
}

function DatePickerField({ label, id, value, onSelect }: {
  label: string;
  id: string;
  value: string;
  onSelect: (date: Date | undefined) => void;
}) {
  const selected = value ? new Date(value + "T12:00:00") : undefined;
  const fromYear = 2000;
  const toYear = 2100;
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
        {label}
      </label>
      <Popover>
        <PopoverTrigger
          id={id}
          className="flex w-full cursor-pointer items-center justify-start gap-2 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm outline-none ring-teal-500 transition hover:bg-slate-100 focus-visible:ring-2"
        >
          <CalendarIcon className="size-4 shrink-0 text-slate-400" />
          <span className={selected ? "text-slate-800" : "text-slate-400"}>
            {selected ? format(selected, "PPP") : "Pick a date"}
          </span>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selected}
            onSelect={onSelect}
            className="[&_button]:cursor-pointer"
            fromYear={fromYear}
            toYear={toYear}
            captionLayout="dropdown"
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

export default function AssignMedicalStaffModal({ isOpen, onClose, onSubmit }: AssignMedicalStaffModalProps) {
  const [inmateId, setInmateId] = useState("");
  const [medicalStaffId, setMedicalStaffId] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setDate(format(new Date(), "yyyy-MM-dd"));
    }
  }, [isOpen]);

  function handleClose() {
    setInmateId("");
    setMedicalStaffId("");
    setDate("");
    onClose();
  }

  async function handleSubmit() {
    if (!inmateId || !medicalStaffId || !date) return;
    
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("medical_records")
        .insert({
          inmate_id: parseInt(inmateId),
          staff_id: parseInt(medicalStaffId),
          record_date: date,
          visit_type: "Routine Checkup" // Default visit type
        });

      if (error) throw error;

      toast.success("Medical staff assigned successfully.");
      onSubmit({ inmateId, medicalStaffId, date });
      handleClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      console.error("Error assigning medical staff:", err);
      toast.error("Failed to assign medical staff: " + errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="assign-medical-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.55)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) handleClose();
          }}
          aria-modal="true"
          role="dialog"
          aria-labelledby="assign-medical-modal-title"
        >
          <motion.div
            className="relative flex w-full max-w-3xl min-w-125 h-175 flex-col rounded-2xl bg-white shadow-2xl overflow-hidden"
            initial={{ opacity: 0, scale: 0.94, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 24 }}
            transition={{ type: "spring", duration: 0.38, bounce: 0.18 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 bg-blue-700 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
                  <Stethoscope size={18} className="text-white" />
                </div>
                <div>
                  <p id="assign-medical-modal-title" className="font-lexend text-lg font-semibold text-white leading-tight">
                    Assign Medical Staff
                  </p>
                  <p className="text-xs text-teal-100">Assign a medical staff to an inmate</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="cursor-pointer rounded-full p-1.5 text-white/80 transition hover:bg-white/20 hover:text-white"
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5">
              <div className="flex flex-col gap-5">
                <div>
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">Inmate</label>
                  <PdlCombobox value={inmateId} onValueChange={setInmateId} placeholder="Select inmate" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">Medical Staff</label>
                  <MedicalStaffCombobox value={medicalStaffId} onValueChange={setMedicalStaffId} />
                </div>
                <DatePickerField
                  label="Assignment Date"
                  id="assignment_date"
                  value={date}
                  onSelect={(date) => setDate(date ? format(date, "yyyy-MM-dd") : "")}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end border-t border-slate-200 bg-slate-50 px-6 py-4">
              <IconButton
                onClick={handleSubmit}
                icon={<Stethoscope size={18} />}
                colorClass="bg-blue-700 hover:bg-blue-800 text-white"
                disabled={!inmateId || !medicalStaffId || !date || isSubmitting}
              >
                {isSubmitting ? "Assigning..." : "Assign"}
              </IconButton>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
