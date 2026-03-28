"use client";

import React, { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, X, ClipboardEdit } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import IconButton from "@/components/ui/IconButton";
import PdlCombobox from "../../components/PdlCombobox";
import { Dialog, DialogContent } from "@/components/ui/dialog";

export interface AddBehaviorLogFormData {
  inmate_id: string;
  log_date: string;
  rating: "Excellent" | "Good" | "Fair" | "Poor" | "";
  notes: string;
}

interface AddBehaviorLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: AddBehaviorLogFormData) => void;
}

function DatePickerField({ id, value, onSelect }: {
  id: string;
  value: string;
  onSelect: (date: Date | undefined) => void;
}) {
  const selected = value ? new Date(value + "T12:00:00") : undefined;
  const fromYear = 1900;
  const toYear = 2100;
  return (
    <div className="w-full">
      <Popover>
        <PopoverTrigger
          id={id}
          className="flex w-full cursor-pointer items-center justify-between rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-teal-500"
        >
          <span className={selected ? "text-slate-800" : "text-slate-500"}>
            {selected ? format(selected, "dd/MM/yyyy") : "dd/mm/yyyy"}
          </span>
          <CalendarIcon className="size-4 shrink-0 text-slate-700" />
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

type ValidationErrors = Partial<Record<keyof AddBehaviorLogFormData, string>>;

function validateField(name: keyof AddBehaviorLogFormData, value: string): string {
  switch (name) {
    case "inmate_id":
      if (!value) return "Please select an inmate.";
      break;
    case "log_date":
      if (!value) return "Log date is required.";
      break;
    case "rating":
      if (!value) return "Behavior rating is required.";
      break;
    default:
      break;
  }
  return "";
}

function validateForm(form: AddBehaviorLogFormData): ValidationErrors {
  const errors: ValidationErrors = {};
  (Object.keys(form) as (keyof AddBehaviorLogFormData)[]).forEach((key) => {
    const error = validateField(key, form[key] || "");
    if (error) errors[key] = error;
  });
  return errors;
}

function Field({ label, id, children, error }: { label: string; id: string; children: React.ReactNode; error?: string }) {
  return (
    <div className="flex flex-col gap-1.5 relative">
      <label htmlFor={id} className={`text-xs font-semibold uppercase tracking-wide font-lexend ${error ? 'text-red-500' : 'text-slate-600'}`}>
        {label}
      </label>
      <div className="relative">
        {children}
      </div>
      {error && <span className="text-[10px] font-medium text-red-500 mt-0.5">{error}</span>}
    </div>
  );
}

const textareaClass = "w-full rounded-lg border bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none placeholder:text-slate-400 transition resize-none pr-9 border-slate-300 focus:border-teal-500 focus:ring-2 ring-teal-500";

export default function AddBehaviorLogModal({ isOpen, onClose, onSubmit }: AddBehaviorLogModalProps) {
  const [form, setForm] = useState<AddBehaviorLogFormData>({
    inmate_id: "",
    log_date: format(new Date(), "yyyy-MM-dd"), // Default to today
    rating: "",
    notes: ""
  });
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof AddBehaviorLogFormData, boolean>>>({});

  const handleClose = () => {
    setForm({
      inmate_id: "",
      log_date: format(new Date(), "yyyy-MM-dd"),
      rating: "",
      notes: ""
    });
    setErrors({});
    setTouched({});
    onClose();
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name as keyof AddBehaviorLogFormData]: value }));
    setTouched(prev => ({ ...prev, [name as keyof AddBehaviorLogFormData]: true }));
    setErrors(prev => ({ ...prev, [name as keyof AddBehaviorLogFormData]: validateField(name as keyof AddBehaviorLogFormData, value) }));
  };

  const handleFieldChange = (name: string, value: string) => {
    setForm(prev => ({ ...prev, [name as keyof AddBehaviorLogFormData]: value }));
    setTouched(prev => ({ ...prev, [name as keyof AddBehaviorLogFormData]: true }));
    setErrors(prev => ({ ...prev, [name as keyof AddBehaviorLogFormData]: validateField(name as keyof AddBehaviorLogFormData, value) }));
  };

  const handleSubmit = () => {
    const validationErrors = validateForm(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      const allTouched = (Object.keys(form) as (keyof AddBehaviorLogFormData)[]).reduce((acc, key) => {
        acc[key] = true;
        return acc;
      }, {} as Record<keyof AddBehaviorLogFormData, boolean>);
      setTouched(allTouched);
      return;
    }
    onSubmit(form);
    handleClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent 
        className="flex w-full max-w-lg min-w-100 flex-col rounded-2xl bg-white shadow-2xl overflow-hidden border-none p-0"
        showCloseButton={false}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-teal-700 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
              <ClipboardEdit size={18} className="text-white" />
            </div>
            <div>
              <p className="font-lexend text-lg font-semibold text-white leading-tight">
                Add New Behavior Log
              </p>
              <p className="text-xs text-teal-100">Inmate Behavior Assessment</p>
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
        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-6">
          <form className="flex flex-col gap-5">
            <Field label="Select Inmate" id="inmate_id" error={touched.inmate_id ? errors.inmate_id : undefined}>
              <PdlCombobox 
                value={form.inmate_id} 
                onValueChange={(val) => handleFieldChange("inmate_id", val)} 
                showAll={true}
                placeholder="Search and select an inmate..."
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Log Date" id="log_date" error={touched.log_date ? errors.log_date : undefined}>
                <DatePickerField 
                  id="log_date" 
                  value={form.log_date} 
                  onSelect={(date) => handleFieldChange("log_date", date ? format(date, "yyyy-MM-dd") : "")} 
                />
              </Field>

              <Field label="Behavior Rating" id="rating" error={touched.rating ? errors.rating : undefined}>
                <Select value={form.rating} onValueChange={(val) => handleFieldChange("rating", val ?? "")}> 
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select rating" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Excellent">Excellent</SelectItem>
                    <SelectItem value="Good">Good</SelectItem>
                    <SelectItem value="Fair">Fair</SelectItem>
                    <SelectItem value="Poor">Poor</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <Field label="Note" id="notes" error={touched.notes ? errors.notes : undefined}>
              <textarea 
                id="notes" 
                name="notes" 
                rows={4} 
                value={form.notes} 
                onChange={handleChange} 
                className={textareaClass}
                placeholder="Enter behavior observation details..."
              ></textarea>
            </Field>
          </form>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-slate-200 bg-slate-50 px-6 py-4 rounded-b-2xl">
          <IconButton
            onClick={handleSubmit}
            icon={<ClipboardEdit size={18} />}
            colorClass="bg-teal-700 hover:bg-teal-800 text-white"
          >
            Add New Log
          </IconButton>
        </div>
      </DialogContent>
    </Dialog>
  );
}
