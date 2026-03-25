"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { format } from "date-fns";
import { CalendarIcon, X } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import IconButton from "@/components/ui/IconButton";
import { CheckIcon } from "lucide-react";
import { differenceInWeeks } from "date-fns";
import RehabStaffCombobox from "../../components/RehabStaffCombobox";

export interface AddProgramFormData {
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
}

interface AddProgramModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: AddProgramFormData) => void;
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

type ValidationErrors = Partial<Record<keyof AddProgramFormData, string>>;

function validateField(name: keyof AddProgramFormData, value: string): string {
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

function validateForm(form: AddProgramFormData): ValidationErrors {
    const errors: ValidationErrors = {};
    (Object.keys(form) as (keyof AddProgramFormData)[]).forEach((key) => {
        const error = validateField(key, form[key] || "");
        if (error) errors[key] = error;
    });
    return errors;
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


export default function AddProgramModal({ isOpen, onClose, onSubmit }: AddProgramModalProps) {
    const [form, setForm] = useState<AddProgramFormData>({
        program_name: "",
        program_type: "",
        description: "",
        start_date: "",
        end_date: "",
        duration: "",
        capacity: "",
        location: "",
        assigned_staff: "",
        requirements: ""
    });
    const [errors, setErrors] = useState<ValidationErrors>({});
    const [touched, setTouched] = useState<Partial<Record<keyof AddProgramFormData, boolean>>>({});

    const handleClose = () => {
        setForm({
            program_name: "", program_type: "", description: "", start_date: "",
            end_date: "", duration: "", capacity: "", location: "",
            assigned_staff: "", requirements: ""
        });
        setErrors({});
        setTouched({});
        onClose();
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
        setTouched(prev => ({ ...prev, [name]: true }));
        setErrors(prev => ({ ...prev, [name]: validateField(name as keyof AddProgramFormData, value) }));
    };

    const handleFieldChange = (name: string, value: string) => {
        setForm(prev => {
            const nextForm = { ...prev, [name]: value };
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
        setTouched(prev => ({ ...prev, [name]: true }));
        setErrors(prev => ({ ...prev, [name]: validateField(name as keyof AddProgramFormData, value) }));
    };

    const handleSubmit = () => {
        const validationErrors = validateForm(form);
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            // Mark all fields as touched to show errors
            const allTouched = (Object.keys(form) as (keyof AddProgramFormData)[]).reduce((acc, key) => {
                acc[key] = true;
                return acc;
            }, {} as Record<keyof AddProgramFormData, boolean>);
            setTouched(allTouched);
            return;
        }
        onSubmit(form);
        handleClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    key="add-program-modal"
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
                    aria-labelledby="modal-title"
                >
                    <motion.div
                        className="relative flex w-full max-w-3xl min-w-125 h-162.5 flex-col rounded-2xl bg-white shadow-2xl overflow-hidden"
                        initial={{ opacity: 0, scale: 0.94, y: 24 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.94, y: 24 }}
                        transition={{ type: "spring", duration: 0.38, bounce: 0.18 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-slate-200 bg-teal-700 px-6 py-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
                                    <CalendarIcon size={18} className="text-white" />
                                </div>
                                <div>
                                    <p id="modal-title" className="font-lexend text-lg font-semibold text-white leading-tight">
                                        Add New Program
                                    </p>
                                    <p className="text-xs text-teal-100">Program Details</p>
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
                        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto px-3 py-4 sm:px-6 sm:py-5">
                            <form className="flex flex-col gap-3">
                                <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
                                    <div className="flex-1 min-w-0">
                                        <Field label="Program Name" id="program_name" error={touched.program_name ? errors.program_name : undefined} valid={!!(touched.program_name && !errors.program_name)}>
                                            <input type="text" id="program_name" name="program_name" value={form.program_name} onChange={handleChange} className={inputClass} />
                                        </Field>
                                    </div>
                                    <div className="flex-1 min-w-0">
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
                                </div>

                                <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
                                    <div className="flex-1 min-w-0">
                                        <Field label="Start Date" id="start_date" error={touched.start_date ? errors.start_date : undefined} valid={!!(touched.start_date && !errors.start_date)}>
                                            <DatePickerField 
                                                id="start_date" 
                                                value={form.start_date} 
                                                onSelect={(date) => handleFieldChange("start_date", date ? format(date, "yyyy-MM-dd") : "")} 
                                            />
                                        </Field>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <Field label="End Date" id="end_date" error={touched.end_date ? errors.end_date : undefined} valid={!!(touched.end_date && !errors.end_date)}>
                                            <DatePickerField 
                                                id="end_date" 
                                                value={form.end_date} 
                                                onSelect={(date) => handleFieldChange("end_date", date ? format(date, "yyyy-MM-dd") : "")} 
                                            />
                                        </Field>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
                                    <div className="flex-1 min-w-0">
                                        <Field label="Duration (Weeks)" id="duration" valid={!!(touched.duration && !errors.duration)}>
                                            <input type="number" id="duration" name="duration" value={form.duration} onChange={handleChange} className={inputClass + " bg-slate-100 cursor-not-allowed"} readOnly />
                                        </Field>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <Field label="Capacity" id="capacity" error={touched.capacity ? errors.capacity : undefined} valid={!!(touched.capacity && !errors.capacity)}>
                                            <input type="number" id="capacity" name="capacity" value={form.capacity} onChange={handleChange} className={inputClass} />
                                        </Field>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
                                    <div className="flex-1 min-w-0">
                                        <Field label="Location" id="location" error={touched.location ? errors.location : undefined} valid={!!(touched.location && !errors.location)}>
                                            <input type="text" id="location" name="location" value={form.location} onChange={handleChange} className={inputClass} />
                                        </Field>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <Field label="Assigned Staff" id="assigned_staff" error={touched.assigned_staff ? errors.assigned_staff : undefined} valid={!!(touched.assigned_staff && !errors.assigned_staff)}>
                                            <RehabStaffCombobox 
                                                value={form.assigned_staff} 
                                                onValueChange={(val) => handleFieldChange("assigned_staff", val)} 
                                            />
                                        </Field>
                                    </div>
                                </div>

                                <Field label="Description" id="description" error={touched.description ? errors.description : undefined} valid={!!(touched.description && !errors.description)}>
                                    <textarea id="description" name="description" rows={4} value={form.description} onChange={handleChange} className={textareaClass}></textarea>
                                </Field>

                                <Field label="Requirements" id="requirements" error={touched.requirements ? errors.requirements : undefined} valid={!!(touched.requirements && !errors.requirements)}>
                                    <textarea id="requirements" name="requirements" rows={4} value={form.requirements} onChange={handleChange} className={textareaClass}></textarea>
                                </Field>
                            </form>
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-end border-t border-slate-200 bg-slate-50 px-6 py-4 rounded-b-2xl">
                            <IconButton
                                onClick={handleSubmit}
                                icon={<CalendarIcon size={18} />}
                                colorClass="bg-teal-700 hover:bg-teal-800 text-white"
                                disabled={false}
                            >
                                Add Program
                            </IconButton>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
