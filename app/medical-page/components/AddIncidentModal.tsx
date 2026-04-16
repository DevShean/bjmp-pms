"use client";

import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { X, CheckIcon, ChevronDown, Calendar as CalendarIcon, FileEdit } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import IconButton from "@/components/ui/IconButton";
import PdlCombobox from "../../components/PdlCombobox";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";

interface AddIncidentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: () => void;
}

export type AddIncidentFormData = {
    inmate_id: string;
    incident_date: string;
    incident_type: string;
    severity_level: string;
    location: string;
    reported_by: string;
    witnesses: string;
    description: string;
    action_taken: string;
    remarks: string;
};

// UI Components following AddProgramModal pattern
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
                    className="flex w-full cursor-pointer items-center justify-between rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-indigo-500"
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

function Field({ label, id, children, error, valid }: { label: string; id: string; children: React.ReactNode; error?: string; valid?: boolean }) {
    return (
        <div className="flex flex-col gap-1.5 relative">
            <label htmlFor={id} className={`text-xs font-semibold uppercase tracking-wide font-lexend ${error ? 'text-red-500' : 'text-slate-600'}`}>
                {label}
            </label>
            <div className="relative">
                {children}
                {valid && !error && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-600 pointer-events-none">
                        <CheckIcon size={16} strokeWidth={3} />
                    </span>
                )}
            </div>
            {error && <span className="text-[10px] font-medium text-red-500 mt-0.5">{error}</span>}
        </div>
    );
}

function InlineCombobox({ id, value, onChange, options, placeholder }: {
    id?: string;
    value: string;
    onChange: (val: string) => void;
    options: string[];
    placeholder: string;
}) {
    const [open, setOpen] = useState(false);
    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger
                id={id}
                className="flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm outline-none transition hover:bg-slate-100"
            >
                <span className={value ? "text-slate-800" : "text-slate-400"}>{value || placeholder}</span>
                <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
            </PopoverTrigger>
            <PopoverContent align="start" sideOffset={6} className="w-48 p-1">
                {options.map((opt) => (
                    <button key={opt} type="button" onClick={() => { onChange(opt); setOpen(false); }} className="flex w-full cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100">
                        <span className="flex-1 text-left">{opt}</span>
                        {value === opt && <CheckIcon className="h-3.5 w-3.5 text-indigo-600" />}
                    </button>
                ))}
            </PopoverContent>
        </Popover>
    );
}

const inputClass = "w-full rounded-lg border bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none placeholder:text-slate-400 transition pr-9 border-slate-300 focus:border-indigo-500 focus:ring-2 ring-indigo-500/20";
const textareaClass = "w-full rounded-lg border bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none placeholder:text-slate-400 transition resize-none pr-9 border-slate-300 focus:border-indigo-500 focus:ring-2 ring-indigo-500/20";

export default function AddIncidentModal({ isOpen, onClose, onSubmit }: AddIncidentModalProps) {
    const [formData, setFormData] = useState<AddIncidentFormData>({
        inmate_id: "",
        incident_date: format(new Date(), "yyyy-MM-dd"),
        incident_type: "Other",
        severity_level: "Low",
        location: "",
        reported_by: "",
        witnesses: "",
        description: "",
        action_taken: "",
        remarks: "",
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [touched, setTouched] = useState<Partial<Record<keyof AddIncidentFormData, boolean>>>({});

    useEffect(() => {
        if (isOpen) {
            setFormData(prev => ({
                ...prev,
                incident_date: format(new Date(), "yyyy-MM-dd"),
            }));
            setTouched({});
        }
    }, [isOpen]);

    const handleFieldChange = (name: string, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value }));
        setTouched(prev => ({ ...prev, [name]: true }));
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        handleFieldChange(name, value);
    };

    const handleClose = () => {
        setFormData({
            inmate_id: "", incident_date: format(new Date(), "yyyy-MM-dd"), incident_type: "Other",
            severity_level: "Low", location: "", reported_by: "", witnesses: "",
            description: "", action_taken: "", remarks: "",
        });
        setTouched({});
        onClose();
    };

    const handleSubmit = async () => {
        if (!formData.inmate_id || !formData.description) {
            toast.error("Please fill in required fields (Inmate and Description)");
            setTouched({ inmate_id: true, description: true });
            return;
        }

        setIsSubmitting(true);
        try {
            // Get current user for staff_id
            const { data: userData } = await supabase.from("users").select("user_id").eq("role_id", 3).limit(1).single();
            const staffId = userData?.user_id || 1;

            const { error } = await supabase.from("incidents").insert({
                inmate_id: parseInt(formData.inmate_id),
                staff_id: staffId,
                incident_date: formData.incident_date,
                incident_type: formData.incident_type,
                severity_level: formData.severity_level,
                location: formData.location,
                reported_by: formData.reported_by,
                witnesses: formData.witnesses,
                description: formData.description,
                action_taken: formData.action_taken,
                remarks: formData.remarks,
                status: "Reported"
            });

            if (error) throw error;

            toast.success("Medical incident recorded successfully.");
            onSubmit();
            handleClose();
        } catch (err) {
            console.error("Error recording incident:", err);
            toast.error("Failed to record incident.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <DialogContent 
                className="flex w-full max-w-3xl min-w-125 h-162.5 max-h-[90vh] flex-col rounded-2xl bg-white shadow-2xl overflow-hidden border-none p-0"
                showCloseButton={false}
            >
                {/* Header (Branded indigo like AddProgramModal's teal) */}
                <div className="flex items-center justify-between border-b border-slate-200 bg-indigo-700 px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
                            <FileEdit size={18} className="text-white" />
                        </div>
                        <div>
                            <p className="font-lexend text-lg font-semibold text-white leading-tight">
                                Log Medical Incident
                            </p>
                            <p className="text-xs text-indigo-100">Incident Details</p>
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
                    <form className="flex flex-col gap-4" onSubmit={(e) => e.preventDefault()}>
                        <div className="flex flex-col gap-4 sm:flex-row">
                            <div className="flex-1 min-w-0">
                                <Field label="Inmate" id="inmate_id" valid={touched.inmate_id && !!formData.inmate_id}>
                                    <PdlCombobox 
                                        value={formData.inmate_id} 
                                        onValueChange={(val) => handleFieldChange("inmate_id", val)} 
                                        placeholder="Search inmate by name"
                                    />
                                </Field>
                            </div>
                            <div className="flex-1 min-w-0">
                                <Field label="Incident Date" id="incident_date" valid={touched.incident_date && !!formData.incident_date}>
                                    <DatePickerField 
                                        id="incident_date" 
                                        value={formData.incident_date} 
                                        onSelect={(date) => handleFieldChange("incident_date", date ? format(date, "yyyy-MM-dd") : "")} 
                                    />
                                </Field>
                            </div>
                        </div>

                        <div className="flex flex-col gap-4 sm:flex-row">
                            <div className="flex-1 min-w-0">
                                <Field label="Incident Type" id="incident_type">
                                    <InlineCombobox
                                        id="incident_type"
                                        value={formData.incident_type}
                                        onChange={(val) => handleFieldChange("incident_type", val)}
                                        options={["Health Emergency", "Violence", "Contraband", "Other"]}
                                        placeholder="Select type"
                                    />
                                </Field>
                            </div>
                            <div className="flex-1 min-w-0">
                                <Field label="Severity Level" id="severity_level">
                                    <InlineCombobox
                                        id="severity_level"
                                        value={formData.severity_level}
                                        onChange={(val) => handleFieldChange("severity_level", val)}
                                        options={["Low", "Medium", "High", "Critical"]}
                                        placeholder="Select severity"
                                    />
                                </Field>
                            </div>
                        </div>

                        <div className="flex flex-col gap-4 sm:flex-row">
                            <div className="flex-1 min-w-0">
                                <Field label="Location" id="location" valid={touched.location && !!formData.location}>
                                    <input type="text" id="location" name="location" placeholder="Enter location" value={formData.location} onChange={handleInputChange} className={inputClass} />
                                </Field>
                            </div>
                            <div className="flex-1 min-w-0">
                                <Field label="Reported By" id="reported_by" valid={touched.reported_by && !!formData.reported_by}>
                                    <input type="text" id="reported_by" name="reported_by" placeholder="Enter name" value={formData.reported_by} onChange={handleInputChange} className={inputClass} />
                                </Field>
                            </div>
                        </div>

                        <Field label="Witnesses" id="witnesses">
                            <textarea id="witnesses" name="witnesses" rows={2} placeholder="List any witnesses..." value={formData.witnesses} onChange={handleInputChange} className={textareaClass}></textarea>
                        </Field>

                        <Field label="Description" id="description" valid={touched.description && !!formData.description}>
                            <textarea id="description" name="description" rows={3} placeholder="Provide detailed description..." value={formData.description} onChange={handleInputChange} className={textareaClass} required></textarea>
                        </Field>

                        <div className="flex flex-col gap-4 sm:flex-row">
                            <div className="flex-1 min-w-0">
                                <Field label="Action Taken" id="action_taken">
                                    <textarea id="action_taken" name="action_taken" rows={3} placeholder="Describe actions taken..." value={formData.action_taken} onChange={handleInputChange} className={textareaClass}></textarea>
                                </Field>
                            </div>
                            <div className="flex-1 min-w-0">
                                <Field label="Remarks" id="remarks">
                                    <textarea id="remarks" name="remarks" rows={3} placeholder="Additional notes..." value={formData.remarks} onChange={handleInputChange} className={textareaClass}></textarea>
                                </Field>
                            </div>
                        </div>
                    </form>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end border-t border-slate-200 bg-slate-50 px-6 py-4 rounded-b-2xl">
                    <IconButton
                        onClick={handleSubmit}
                        icon={<FileEdit size={18} />}
                        colorClass="bg-indigo-700 hover:bg-indigo-800 text-white"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? "Logging..." : "Log Incident"}
                    </IconButton>
                </div>
            </DialogContent>
        </Dialog>
    );
}
