"use client";

import { useState, useEffect } from "react";
import { X, Stethoscope, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent } from "@/components/ui/dialog";
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
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent 
        className="flex w-full max-w-lg min-w-[350px] flex-col rounded-2xl bg-white shadow-2xl overflow-hidden p-0 border-none"
        showCloseButton={false}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-blue-700 px-6 py-4 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
              <Stethoscope size={18} className="text-white" />
            </div>
            <div>
              <p id="assign-medical-modal-title" className="font-lexend text-lg font-semibold leading-tight">
                Assign Medical Staff
              </p>
              <p className="text-xs text-blue-100">Assign a medical staff to an inmate</p>
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
        <div className="px-6 py-6 bg-white">
          <div className="flex flex-col gap-6">
            <div>
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1 block">
                Select Inmate
              </label>
              <PdlCombobox value={inmateId} onValueChange={setInmateId} placeholder="Select inmate" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1 block">
                Select Medical Staff
              </label>
              <MedicalStaffCombobox value={medicalStaffId} onValueChange={setMedicalStaffId} />
            </div>
            <div className="w-full">
              <DatePickerField
                label="Assignment Date"
                id="assignment_date"
                value={date}
                onSelect={(date) => setDate(date ? format(date, "yyyy-MM-dd") : "")}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 border rounded-lg bg-white text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!inmateId || !medicalStaffId || !date || isSubmitting}
            className="flex items-center gap-2 rounded-lg bg-blue-700 px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-800 transition disabled:opacity-50 cursor-pointer"
          >
            <Stethoscope size={18} />
            {isSubmitting ? "Assigning..." : "Assign Staff"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
