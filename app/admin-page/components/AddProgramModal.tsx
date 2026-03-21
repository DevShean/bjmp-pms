"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { format } from "date-fns";
import { CalendarIcon, X } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import IconButton from "@/components/ui/IconButton";

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

function DatePickerField({ label, id, value, onSelect }: {
    label: string;
    id: string;
    value: string;
    onSelect: (date: Date | undefined) => void;
}) {
    const selected = value ? new Date(value + "T12:00:00") : undefined;
    const fromYear = 1900;
    const toYear = 2100;
    return (
        <div className="flex flex-col gap-1.5 w-full">
            <label htmlFor={id} className="text-sm font-semibold text-slate-700">
                {label}
            </label>
            <Popover>
                <PopoverTrigger
                    id={id}
                    className="flex w-full cursor-pointer items-center justify-between rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-blue-500"
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

function Field({ label, id, children }: { label: string; id: string; children: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-2 relative">
            <label htmlFor={id} className="text-xs font-semibold text-slate-600 uppercase tracking-wide font-lexend">
                {label}
            </label>
            <div className="relative">{children}</div>
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

    function handleClose() {
        setForm({
            program_name: "", program_type: "", description: "", start_date: "",
            end_date: "", duration: "", capacity: "", location: "",
            assigned_staff: "", requirements: ""
        });
        onClose();
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleFieldChange = (name: string, value: string) => {
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = () => {
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
                                        <Field label="Program Name" id="program_name">
                                            <input type="text" id="program_name" name="program_name" value={form.program_name} onChange={handleChange} className={inputClass} />
                                        </Field>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <Field label="Program Type" id="program_type">
                                            <Select value={form.program_type} onValueChange={(val) => handleFieldChange("program_type", val || "")}> 
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder="Select type" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Educational">Educational</SelectItem>
                                                    <SelectItem value="Vocational">Vocational</SelectItem>
                                                    <SelectItem value="Rehabilitation">Rehabilitation</SelectItem>
                                                    <SelectItem value="Recreational">Recreational</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </Field>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
                                    <div className="flex-1 min-w-0">
                                        <Field label="Start Date" id="start_date">
                                            <DatePickerField 
                                                label="Start Date" 
                                                id="start_date" 
                                                value={form.start_date} 
                                                onSelect={(date) => handleFieldChange("start_date", date ? format(date, "yyyy-MM-dd") : "")} 
                                            />
                                        </Field>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <Field label="End Date" id="end_date">
                                            <DatePickerField 
                                                label="End Date" 
                                                id="end_date" 
                                                value={form.end_date} 
                                                onSelect={(date) => handleFieldChange("end_date", date ? format(date, "yyyy-MM-dd") : "")} 
                                            />
                                        </Field>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
                                    <div className="flex-1 min-w-0">
                                        <Field label="Duration (Weeks)" id="duration">
                                            <input type="number" id="duration" name="duration" value={form.duration} onChange={handleChange} className={inputClass} />
                                        </Field>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <Field label="Capacity" id="capacity">
                                            <input type="number" id="capacity" name="capacity" value={form.capacity} onChange={handleChange} className={inputClass} />
                                        </Field>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
                                    <div className="flex-1 min-w-0">
                                        <Field label="Location" id="location">
                                            <input type="text" id="location" name="location" value={form.location} onChange={handleChange} className={inputClass} />
                                        </Field>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <Field label="Assigned Staff" id="assigned_staff">
                                            <Select value={form.assigned_staff} onValueChange={(val) => handleFieldChange("assigned_staff", val || "")}> 
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder="Select staff" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Quenyss Almaden">Quenyss Almaden</SelectItem>
                                                    <SelectItem value="John Doe">John Doe</SelectItem>
                                                    <SelectItem value="Jane Smith">Jane Smith</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </Field>
                                    </div>
                                </div>

                                <Field label="Description" id="description">
                                    <textarea id="description" name="description" rows={4} value={form.description} onChange={handleChange} className={textareaClass}></textarea>
                                </Field>

                                <Field label="Requirements" id="requirements">
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
