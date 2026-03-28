"use client";

import React, { useState, useCallback, useEffect } from "react";
import { format, differenceInWeeks } from "date-fns";
import { X, CalendarIcon, BookOpen, MapPin, ClipboardList, Check as CheckIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import RehabStaffCombobox from "../../components/RehabStaffCombobox";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";
import IconButton from "@/components/ui/IconButton";
import { Dialog, DialogContent } from "@/components/ui/dialog";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EditProgramFormData {
    program_name: string;
    program_type: string;
    description: string;
    start_date: string;
    end_date: string;
    duration: string;
    capacity: string;
    location: string;
    assigned_staff: string;
    requirements: string;
    status: string;
}

const INITIAL_FORM: EditProgramFormData = {
    program_name: "",
    program_type: "",
    description: "",
    start_date: "",
    end_date: "",
    duration: "",
    capacity: "",
    location: "",
    assigned_staff: "",
    requirements: "",
    status: "Active",
};

// ─── Shared UI Logic ──────────────────────────────────────────────────────────

type FieldProps = {
    label: string;
    id: string;
    children: React.ReactNode;
    error?: string;
    valid?: boolean;
};

function Field({ label, id, children, error, valid }: FieldProps) {
    return (
        <div className="flex flex-col gap-1 relative">
            <label htmlFor={id} className={`text-xs font-semibold uppercase tracking-wide font-lexend ${error ? 'text-red-500' : 'text-slate-600'}`}>
                {label}
            </label>
            <div className="relative">
                {children}
                {valid && !error && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-teal-600 pointer-events-none">
                        <CheckIcon size={16} strokeWidth={3} />
                    </span>
                )}
            </div>
            {error && <span className="text-[10px] font-medium text-red-500 mt-0.5">{error}</span>}
        </div>
    );
}

const inputClass = "w-full rounded-lg border bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none placeholder:text-slate-400 transition pr-9 border-slate-300 focus:border-teal-500 focus:ring-2 ring-teal-500";
const textareaClass = "w-full rounded-lg border bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none placeholder:text-slate-400 transition resize-none pr-9 border-slate-300 focus:border-teal-500 focus:ring-2 ring-teal-500";

function DatePickerField({ id, value, onSelect }: {
    id: string;
    value: string;
    onSelect: (date: Date | undefined) => void;
}) {
    const selected = value ? new Date(value + "T12:00:00") : undefined;
    return (
        <div className="w-full">
            <Popover>
                <PopoverTrigger
                    id={id}
                    className="flex w-full cursor-pointer items-center justify-between rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm outline-none transition hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-teal-500"
                >
                    <span className={selected ? "text-slate-800" : "text-slate-500"}>
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
                        fromYear={1900}
                        toYear={2100}
                        captionLayout="dropdown"
                    />
                </PopoverContent>
            </Popover>
        </div>
    );
}

// ─── Validation ──────────────────────────────────────────────────────────────

type ValidationErrors = Partial<Record<keyof EditProgramFormData, string>>;

function validateField(name: keyof EditProgramFormData, value: string): string {
    switch (name) {
        case "program_name":
            if (!value.trim()) return "Program name is required.";
            break;
        case "program_type":
            if (!value) return "Program type is required.";
            break;
        case "start_date":
            if (!value) return "Start date is required.";
            break;
        case "end_date":
            if (!value) return "End date is required.";
            break;
        case "capacity":
            if (!value.trim()) return "Capacity is required.";
            if (isNaN(Number(value))) return "Must be a number.";
            if (Number(value) <= 0) return "Must be greater than 0.";
            break;
        case "location":
            if (!value.trim()) return "Location is required.";
            break;
        case "assigned_staff":
            if (!value) return "Please assign a staff member.";
            break;
        default:
            break;
    }
    return "";
}

function validateForm(form: EditProgramFormData): ValidationErrors {
    const errors: ValidationErrors = {};
    (Object.keys(form) as (keyof EditProgramFormData)[]).forEach((key) => {
        const error = validateField(key, form[key] || "");
        if (error) errors[key] = error;
    });
    return errors;
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

interface EditProgramModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: () => void;
    programId: string | null;
}

export default function EditProgramModal({ isOpen, onClose, onSubmit, programId }: EditProgramModalProps) {
    const [form, setForm] = useState<EditProgramFormData>(INITIAL_FORM);
    const [errors, setErrors] = useState<ValidationErrors>({});
    const [touched, setTouched] = useState<Partial<Record<keyof EditProgramFormData, boolean>>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const fetchProgramData = useCallback(async () => {
        if (!programId) return;
        setIsLoading(true);
        try {
            const numericId = parseInt(programId, 10);
            const { data, error } = await supabase.from("programs").select("*").eq("program_id", numericId).single();
            if (error) throw error;
            if (data) {
                setForm({
                    program_name: data.program_name || "",
                    program_type: data.program_type || "",
                    description: data.description || "",
                    start_date: data.start_date || "",
                    end_date: data.end_date || "",
                    duration: String(data.duration_weeks || ""),
                    capacity: String(data.capacity || ""),
                    location: data.location || "",
                    assigned_staff: data.assigned_staff_id ? String(data.assigned_staff_id) : "",
                    requirements: data.requirements || "",
                    status: data.status || "Active",
                });
            }
        } catch (err) {
            console.error(err);
            toast.error("Failed to load program details.");
        } finally {
            setIsLoading(false);
        }
    }, [programId]);

    useEffect(() => {
        if (isOpen) {
            fetchProgramData();
        } else {
            setForm(INITIAL_FORM);
            setErrors({});
            setTouched({});
        }
    }, [isOpen, fetchProgramData]);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name as keyof EditProgramFormData]: value }));
        setTouched(prev => ({ ...prev, [name as keyof EditProgramFormData]: true }));
        setErrors(prev => ({ ...prev, [name as keyof EditProgramFormData]: validateField(name as keyof EditProgramFormData, value) }));
    }, []);

    const handleFieldChange = useCallback((name: string, value: string) => {
        setForm(prev => {
            const nextForm = { ...prev, [name as keyof EditProgramFormData]: value };
            if (name === "start_date" || name === "end_date") {
                if (nextForm.start_date && nextForm.end_date) {
                    const start = new Date(nextForm.start_date);
                    const end = new Date(nextForm.end_date);
                    if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
                        const weeks = differenceInWeeks(end, start);
                        nextForm.duration = weeks >= 0 ? weeks.toString() : "0";
                    }
                }
            }
            return nextForm;
        });
        setTouched(prev => ({ ...prev, [name as keyof EditProgramFormData]: true }));
        setErrors(prev => ({ ...prev, [name as keyof EditProgramFormData]: validateField(name as keyof EditProgramFormData, value) }));
    }, []);

    const handleSubmit = async () => {
        const validation = validateForm(form);
        setErrors(validation);
        if (Object.keys(validation).length > 0) {
            toast.error("Please fill out all required fields.");
            // Mark all fields as touched
            const allTouched = (Object.keys(form) as (keyof EditProgramFormData)[]).reduce((acc, key) => {
                acc[key] = true;
                return acc;
            }, {} as Record<keyof EditProgramFormData, boolean>);
            setTouched(allTouched);
            return;
        }

        setIsSubmitting(true);
        try {
            const numericId = parseInt(programId!, 10);
            const { error } = await supabase
                .from("programs")
                .update({
                    program_name: form.program_name,
                    program_type: form.program_type,
                    description: form.description,
                    start_date: form.start_date,
                    end_date: form.end_date,
                    duration_weeks: parseInt(form.duration),
                    capacity: parseInt(form.capacity),
                    location: form.location,
                    assigned_staff_id: form.assigned_staff ? parseInt(form.assigned_staff) : null,
                    requirements: form.requirements,
                    status: form.status,
                })
                .eq("program_id", numericId);

            if (error) throw error;

            toast.success("Program updated successfully!");
            onSubmit();
            onClose();
        } catch (err: unknown) {
            console.error(err);
            toast.error(`Update failed: ${(err as Error).message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent 
                className="flex w-full max-w-3xl min-w-[500px] h-[650px] max-h-[90vh] flex-col rounded-2xl bg-white shadow-2xl overflow-hidden border-none p-0"
                showCloseButton={false}
            >
                {/* Header */}
                <div className="flex items-center justify-between border-b bg-teal-700 px-6 py-4 text-white">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
                            <BookOpen size={22} className="text-white" />
                        </div>
                        <div>
                            <h2 className="font-lexend text-xl font-semibold leading-tight">Edit Program</h2>
                            <p className="text-xs text-teal-100 flex items-center gap-1.5 mt-0.5 uppercase tracking-wider font-medium">
                                Update program details and requirements
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-full p-2 text-white/80 transition hover:bg-white/20 hover:text-white cursor-pointer"
                        aria-label="Close modal"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 min-h-0 overflow-y-auto px-1 sm:px-6 py-6 scrollbar-hide">
                    {isLoading ? (
                        <div className="flex h-full items-center justify-center">
                            <p className="text-slate-500 animate-pulse">Loading program data...</p>
                        </div>
                    ) : (
                        <form className="space-y-5">
                            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                                <Field label="Program Name" id="program_name" error={touched.program_name ? errors.program_name : undefined} valid={!!(touched.program_name && !errors.program_name)}>
                                    <input type="text" id="program_name" name="program_name" value={form.program_name} onChange={handleChange} className={inputClass} />
                                </Field>
                                <Field label="Program Type" id="program_type" error={touched.program_type ? errors.program_type : undefined} valid={!!(touched.program_type && !errors.program_type)}>
                                    <Select value={form.program_type} onValueChange={(val) => handleFieldChange("program_type", val || "")}>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Educational">Educational</SelectItem>
                                            <SelectItem value="Vocational">Vocational</SelectItem>
                                            <SelectItem value="Psychological">Psychological</SelectItem>
                                            <SelectItem value="Other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </Field>
                            </div>

                            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                                <Field label="Start Date" id="start_date" error={touched.start_date ? errors.start_date : undefined} valid={!!(touched.start_date && !errors.start_date)}>
                                    <DatePickerField 
                                        id="start_date" 
                                        value={form.start_date} 
                                        onSelect={(date) => handleFieldChange("start_date", date ? format(date, "yyyy-MM-dd") : "")} 
                                    />
                                </Field>
                                <Field label="End Date" id="end_date" error={touched.end_date ? errors.end_date : undefined} valid={!!(touched.end_date && !errors.end_date)}>
                                    <DatePickerField 
                                        id="end_date" 
                                        value={form.end_date} 
                                        onSelect={(date) => handleFieldChange("end_date", date ? format(date, "yyyy-MM-dd") : "")} 
                                    />
                                </Field>
                            </div>

                            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                                <Field label="Duration (Weeks)" id="duration">
                                    <input type="number" id="duration" name="duration" value={form.duration} className={inputClass + " bg-slate-100 cursor-not-allowed"} readOnly />
                                </Field>
                                <Field label="Capacity" id="capacity" error={touched.capacity ? errors.capacity : undefined} valid={!!(touched.capacity && !errors.capacity)}>
                                    <input type="number" id="capacity" name="capacity" value={form.capacity} onChange={handleChange} className={inputClass} />
                                </Field>
                                <Field label="Status" id="status">
                                    <Select value={form.status} onValueChange={(val) => handleFieldChange("status", val || "Active")}>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Active">Active</SelectItem>
                                            <SelectItem value="Upcoming">Upcoming</SelectItem>
                                            <SelectItem value="Completed">Completed</SelectItem>
                                            <SelectItem value="Inactive">Inactive</SelectItem>
                                            <SelectItem value="Cancelled">Cancelled</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </Field>
                            </div>

                            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                                <Field label="Location" id="location" error={touched.location ? errors.location : undefined} valid={!!(touched.location && !errors.location)}>
                                    <div className="relative">
                                        <input type="text" id="location" name="location" value={form.location} onChange={handleChange} className={inputClass} />
                                        <MapPin size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                    </div>
                                </Field>
                                <Field label="Assigned Staff" id="assigned_staff" error={touched.assigned_staff ? errors.assigned_staff : undefined} valid={!!(touched.assigned_staff && !errors.assigned_staff)}>
                                    <RehabStaffCombobox value={form.assigned_staff} onValueChange={(val) => handleFieldChange("assigned_staff", val)} />
                                </Field>
                            </div>

                            <Field label="Description" id="description" error={touched.description ? errors.description : undefined} valid={!!(touched.description && !errors.description)}>
                                <textarea id="description" name="description" rows={3} value={form.description} onChange={handleChange} className={textareaClass}></textarea>
                            </Field>

                            <Field label="Requirements" id="requirements" error={touched.requirements ? errors.requirements : undefined} valid={!!(touched.requirements && !errors.requirements)}>
                                <textarea id="requirements" name="requirements" rows={3} value={form.requirements} onChange={handleChange} className={textareaClass}></textarea>
                            </Field>
                        </form>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 border-t bg-slate-50 px-6 py-4 rounded-b-2xl">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 cursor-pointer"
                    >
                        Cancel
                    </button>
                    <IconButton
                        onClick={handleSubmit}
                        icon={<ClipboardList size={18} />}
                        colorClass="bg-teal-700 hover:bg-teal-800 text-white"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? "Updating..." : "Update Program"}
                    </IconButton>
                </div>
            </DialogContent>
        </Dialog>
    );
}
