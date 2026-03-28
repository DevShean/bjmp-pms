"use client";

import React, { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, X, FileSpreadsheet } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import IconButton from "@/components/ui/IconButton";
import { Dialog, DialogContent } from "@/components/ui/dialog";

export interface GenerateReportData {
  startDate: string;
  endDate: string;
}

interface GenerateReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: GenerateReportData) => void;
}

function DatePickerField({ id, value, onSelect }: {
  id: string;
  value: string;
  onSelect: (date: Date | undefined) => void;
}) {
  const selected = value ? new Date(value + "T12:00:00") : undefined;
  const fromYear = 2000;
  const toYear = 2100;
  return (
    <div className="w-full">
      <Popover>
        <PopoverTrigger
          id={id}
          className="flex w-full cursor-pointer items-center justify-between rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-teal-500"
        >
          <span className={selected ? "text-slate-800" : "text-slate-500"}>
            {selected ? format(selected, "MMMM dd, yyyy") : "Select date"}
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

export default function GenerateReportModal({ isOpen, onClose, onSubmit }: GenerateReportModalProps) {
  const [startDate, setStartDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  
  const handleClose = () => {
    onClose();
  }

  const handleSubmit = () => {
    if (!startDate || !endDate) return;
    onSubmit({ startDate, endDate });
    handleClose();
  };

  const isFormValid = startDate && endDate && new Date(startDate) <= new Date(endDate);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent 
        className="flex w-full max-w-md flex-col rounded-2xl bg-white shadow-2xl overflow-hidden border-none p-0"
        showCloseButton={false}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-teal-700 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
              <FileSpreadsheet size={18} className="text-white" />
            </div>
            <div>
              <p className="font-lexend text-lg font-semibold text-white leading-tight">
                Generate Behavior Report
              </p>
              <p className="text-xs text-teal-100">Select reporting period</p>
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
        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-8">
          <div className="flex flex-col gap-6">
            <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
               <p className="text-xs text-blue-800 leading-relaxed">
                 Select the starting and ending dates for the behavior log report. The generated report will include all behavior observations within this duration.
               </p>
            </div>

            <div className="grid grid-cols-1 gap-5">
              <Field label="Starting Date" id="start_date">
                <DatePickerField 
                  id="start_date" 
                  value={startDate} 
                  onSelect={(date) => setStartDate(date ? format(date, "yyyy-MM-dd") : "")} 
                />
              </Field>

              <Field label="Ending Date" id="end_date" error={!isFormValid && endDate ? "End date must be after or same as start date" : undefined}>
                <DatePickerField 
                  id="end_date" 
                  value={endDate} 
                  onSelect={(date) => setEndDate(date ? format(date, "yyyy-MM-dd") : "")} 
                />
              </Field>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-slate-200 bg-slate-50 px-6 py-4 rounded-b-2xl">
          <IconButton
            onClick={handleSubmit}
            disabled={!isFormValid}
            icon={<FileSpreadsheet size={18} />}
            colorClass={`bg-teal-700 hover:bg-teal-800 text-white ${!isFormValid ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Generate Report
          </IconButton>
        </div>
      </DialogContent>
    </Dialog>
  );
}
