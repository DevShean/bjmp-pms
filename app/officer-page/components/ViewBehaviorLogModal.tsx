"use client";

import React from "react";
import Image from "next/image";
import { X, ShieldCheck, Calendar, StickyNote, Award } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { BehaviorLogRecord } from "./BehaviorLogsTable";
import { getInmateImageUrl } from "@/app/lib/utils/image";

interface ViewBehaviorLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  log: BehaviorLogRecord | null;
}

const RATING_THEME: Record<BehaviorLogRecord["rating"], { bg: string; text: string, border: string, icon: React.ReactNode }> = {
  Excellent: { 
    bg: "bg-teal-50", 
    text: "text-teal-700", 
    border: "border-teal-200",
    icon: <Award className="text-teal-600" size={18} /> 
  },
  Good: { 
    bg: "bg-blue-50", 
    text: "text-blue-700", 
    border: "border-blue-200",
    icon: <Award className="text-blue-600" size={18} /> 
  },
  Fair: { 
    bg: "bg-orange-50", 
    text: "text-orange-700", 
    border: "border-orange-200",
    icon: <Award className="text-orange-600" size={18} /> 
  },
  Poor: { 
    bg: "bg-rose-50", 
    text: "text-rose-700", 
    border: "border-rose-200",
    icon: <Award className="text-rose-600" size={18} /> 
  },
};

export default function ViewBehaviorLogModal({ isOpen, onClose, log }: ViewBehaviorLogModalProps) {
  if (!log) return null;

  const imageUrl = getInmateImageUrl(log.inmatePhoto, log.inmateName);
  const theme = RATING_THEME[log.rating];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent 
        className="max-w-md overflow-hidden rounded-3xl border-none p-0 shadow-2xl"
        showCloseButton={false}
      >
        {/* Header Section (ID Card Top) */}
        <div className="relative h-32 bg-linear-to-br from-teal-700 to-teal-900 px-6 pt-6">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-widest text-teal-100/70">
                Behavior Record
              </span>
              <span className="font-mono text-sm font-bold text-white">
                ID: #{log.id}
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="relative z-10 rounded-full p-1.5 text-white/80 hover:bg-white/20 hover:text-white transition cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>
          
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 h-full w-32 bg-white/5 mask-[linear-gradient(to_bottom_left,black,transparent)] pointer-events-none" />
        </div>

        {/* Content Section (ID Card Body) */}
        <div className="relative bg-white px-6 pb-8 pt-16">
          {/* Overlapping Profile Photo */}
          <div className="absolute -top-12 left-6 flex h-24 w-24 items-center justify-center rounded-2xl border-4 border-white bg-white shadow-xl overflow-hidden">
            <Image
              src={imageUrl}
              alt={log.inmateName}
              fill
              className="object-cover"
              unoptimized={imageUrl.startsWith("data:")}
            />
          </div>

          {/* Rating Badge (Floating Right) */}
          <div className={`absolute -top-6 right-6 flex items-center gap-2 rounded-xl border-4 border-white ${theme.bg} ${theme.text} px-4 py-2 font-bold shadow-lg`}>
            {theme.icon}
            {log.rating}
          </div>

          {/* Inmate Info */}
          <div className="mb-6">
            <h2 className="font-lexend text-2xl font-bold text-slate-800">
              {log.inmateName}
            </h2>
            <p className="text-sm font-medium text-slate-500">Inmate Behavior Assessment</p>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-1 gap-4 rounded-2xl bg-slate-50 p-4 border border-slate-100">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <ShieldCheck size={12} />
                  Assessed By
                </span>
                <p className="text-sm font-semibold text-slate-700">{log.staffName}</p>
              </div>
              <div className="space-y-1 text-right">
                <span className="flex items-center justify-end gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <Calendar size={12} />
                  Log Date
                </span>
                <p className="text-sm font-semibold text-slate-700">{log.logDate}</p>
              </div>
            </div>
          </div>

          {/* Notes Section */}
          <div className="mt-6 space-y-2">
            <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">
              <StickyNote size={12} />
              Observations & Notes
            </span>
            <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm min-h-24">
              {log.notes ? (
                <p className="text-sm leading-relaxed text-slate-600 italic">
                  &ldquo;{log.notes}&rdquo;
                </p>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-slate-300">
                  No detailed notes provided for this record.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Card Footer (Branding) */}
        <div className="flex items-center justify-center bg-slate-50/50 py-4 border-t border-slate-50">
           <div className="flex items-center gap-1.5 text-slate-300 grayscale opacity-50">
              <div className="h-2 w-2 rounded-full bg-teal-600" />
              <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-teal-600">BJMP Official Portal</span>
           </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
