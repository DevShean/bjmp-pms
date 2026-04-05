import { useState, useCallback, useEffect } from "react";
import React from "react";
import type { PaginationState } from "@tanstack/react-table";
import { format } from "date-fns";
import { X, ChevronLeft, ChevronRight, Check, ChevronDown, User, Activity, Phone, GraduationCap, Scale, Package, CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import DegreeCombobox from "../../components/DegreeCombobox";
import CourseCombobox from "../../components/CourseCombobox";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

type InmateGender = "Male" | "Female";
type InmateStatus = "Active" | "Released" | "Transferred";
type BloodType = "A" | "B" | "AB" | "O";

type InmateForm = {
    // Step 1 – Personal Information
    first_name: string;
    last_name: string;
    birthdate: string;
    gender: InmateGender | "";
    marital_status: string;
    place_of_birth: string;
    citizenship: string;
    nationality: string;
    religion: string;
    race: string;
    occupation: string;
    no_of_children: string;

    // Step 2 – Physical Description
    height_cm: string;
    weight_kg: string;
    hair_description: string;
    hair_color: string;
    complexion: string;
    eyes_description: string;
    eye_color: string;
    blood_type: BloodType | "";
    identifying_marks: string;

    // Step 3 – Contact & Family
    permanent_address: string;
    provincial_address: string;
    contact_number: string;
    emergency_contact_name: string;
    emergency_contact_number: string;
    father_name: string;
    father_address: string;
    mother_name: string;
    mother_address: string;
    wife_clw_name: string;
    wife_clw_address: string;
    relative_name: string;
    relative_address: string;

    // Step 4 – Educational Background
    educational_attainment: string;
    course: string;
    school_attended: string;

    // Step 5 – Case & Legal
    crime: string;
    offense_charged: string;
    criminal_case_number: string;
    sentence_years: string;
    court_details: string;
    case_court: string;
    case_status: string;
    cell_block: string;
    admission_date: string;
    release_date: string;
    status: InmateStatus | "";
    return_rate: string;
    date_time_received: string;
    turned_over_by: string;
    receiving_duty_officer: string;

    // Step 6 – Property & Photo
    prisoner_property: string;
    property_receipt_number: string;
    photo_path: string;
};

const INITIAL_FORM: InmateForm = {
    first_name: "", last_name: "", birthdate: "", gender: "", marital_status: "",
    place_of_birth: "", citizenship: "", nationality: "", religion: "", race: "",
    occupation: "", no_of_children: "",
    height_cm: "", weight_kg: "", hair_description: "",
    hair_color: "", complexion: "", eyes_description: "", eye_color: "", blood_type: "",
    identifying_marks: "",
    permanent_address: "", provincial_address: "", contact_number: "",
    emergency_contact_name: "", emergency_contact_number: "", father_name: "",
    father_address: "", mother_name: "", mother_address: "", wife_clw_name: "",
    wife_clw_address: "", relative_name: "", relative_address: "",
    educational_attainment: "", course: "", school_attended: "",
    crime: "", offense_charged: "", criminal_case_number: "", sentence_years: "",
    court_details: "", case_court: "", case_status: "", cell_block: "",
    admission_date: "", release_date: "", status: "", return_rate: "",
    date_time_received: "", turned_over_by: "", receiving_duty_officer: "",
    prisoner_property: "", property_receipt_number: "", photo_path: "",
};

// ─── Step Definitions ─────────────────────────────────────────────────────────

const STEPS = [
    { title: "Personal Information",   icon: User },
    { title: "Physical Description",   icon: Activity },
    { title: "Contact & Family",       icon: Phone },
    { title: "Educational Background", icon: GraduationCap },
    { title: "Case & Legal",           icon: Scale },
    { title: "Property & Photo",       icon: Package },
] as const;

// ─── Sub-components ───────────────────────────────────────────────────────────

import { Check as CheckIcon } from "lucide-react";
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
            <label htmlFor={id} className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                {label}
            </label>
            <div className="relative">
                {children}
                {valid && !error && (
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-green-500 pointer-events-none">
                        <CheckIcon size={18} strokeWidth={2.5} />
                    </span>
                )}
            </div>
            {error && <span className="text-xs text-red-500 font-medium mt-0.5">{error}</span>}
        </div>
    );
}


const inputBaseClass =
    "w-full rounded-lg border bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none placeholder:text-slate-400 transition pr-9";
const textareaBaseClass =
    "w-full rounded-lg border bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none placeholder:text-slate-400 transition resize-none pr-9";

function getInputClass(valid: boolean, error: string | undefined) {
    if (error) return `${inputBaseClass} border-red-400 focus:border-red-500 focus:ring-red-500`;
    if (valid) return `${inputBaseClass} border-green-500 focus:border-green-600 focus:ring-green-500`;
    return `${inputBaseClass} border-slate-300 focus:border-teal-500 focus:ring-2 ring-teal-500`;
}
function getTextareaClass(valid: boolean, error: string | undefined) {
    if (error) return `${textareaBaseClass} border-red-400 focus:border-red-500 focus:ring-red-500`;
    if (valid) return `${textareaBaseClass} border-green-500 focus:border-green-600 focus:ring-green-500`;
    return `${textareaBaseClass} border-slate-300 focus:border-teal-500 focus:ring-2 ring-teal-500`;
}

function InlineCombobox({ id, value, onChange, options, placeholder, className }: {
    id?: string;
    value: string;
    onChange: (val: string) => void;
    options: string[];
    placeholder: string;
    className?: string;
}) {
    const [open, setOpen] = useState(false);
    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger id={id} className={`${className} flex items-center justify-between gap-2 cursor-pointer`}>
                <span className={value ? "text-slate-800" : "text-slate-400"}>{value || placeholder}</span>
                <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
            </PopoverTrigger>
            <PopoverContent align="start" sideOffset={6} className="w-48 p-1">
                {options.map((opt) => (
                    <button key={opt} type="button" onClick={() => { onChange(opt); setOpen(false); }} className="flex w-full cursor-pointer items-center gap-2 rounded-md px-3 py-1.5 text-sm text-slate-700 transition hover:bg-slate-100">
                        <span className="flex-1 text-left">{opt}</span>
                        {value === opt && <CheckIcon className="h-3.5 w-3.5 text-teal-600" />}
                    </button>
                ))}
            </PopoverContent>
        </Popover>
    );
}

// ─── Step Renderers ───────────────────────────────────────────────────────────
interface StepProps {
    form: InmateForm;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
    onFieldChange?: (name: keyof InmateForm, value: string) => void;
    errors?: Partial<Record<keyof InmateForm, string>>;
}


// ─── Modal Props ────────────────────────────────────────────────────────────
interface AddInmateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: InmateForm) => void;
}

// ─── DatePickerField ──────────────────────────────────────────────────────────

function DatePickerField({ label, id, value, onSelect }: {
    label: string;
    id: string;
    value: string;
    onSelect: (date: Date | undefined) => void;
}) {
    const selected = value ? new Date(value + "T12:00:00") : undefined;
    // Allow year selection from 1900 to 2100
    const fromYear = 1900;
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

function DateTimePickerField({ label, id, value, onChange }: {
    label: string;
    id: string;
    value: string;
    onChange: (nextValue: string) => void;
}) {
    const selectedDate = value ? new Date(value) : undefined;
    const selectedTime = value ? value.slice(11, 16) : "";

    const handleDateSelect = (date: Date | undefined) => {
        if (!date) {
            onChange("");
            return;
        }

        const datePart = format(date, "yyyy-MM-dd");
        const timePart = selectedTime || "00:00";
        onChange(`${datePart}T${timePart}`);
    };

    const handleTimeChange = (nextTime: string) => {
        if (!nextTime) {
            if (selectedDate) {
                onChange(`${format(selectedDate, "yyyy-MM-dd")}T00:00`);
            }
            return;
        }

        if (selectedDate) {
            onChange(`${format(selectedDate, "yyyy-MM-dd")}T${nextTime}`);
            return;
        }

        onChange(`${format(new Date(), "yyyy-MM-dd")}T${nextTime}`);
    };

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
                    <span className={selectedDate ? "text-slate-800" : "text-slate-400"}>
                        {selectedDate ? `${format(selectedDate, "PPP")} ${selectedTime || "00:00"}` : "Pick date and time"}
                    </span>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <div className="p-2">
                        <Calendar mode="single" selected={selectedDate} onSelect={handleDateSelect} className="[&_button]:cursor-pointer" />
                        <div className="border-t border-slate-200 px-1 pt-2">
                            <label htmlFor={`${id}-time`} className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                                Time
                            </label>
                            <input
                                id={`${id}-time`}
                                type="time"
                                value={selectedTime}
                                onChange={(event) => handleTimeChange(event.target.value)}
                                className="w-full rounded-md border border-slate-300 bg-slate-50 px-2 py-1.5 text-sm text-slate-800 outline-none ring-teal-500 focus:ring-2"
                            />
                        </div>
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
}

function StepPersonal({ form, onChange, onFieldChange, errors }: StepProps) {
    // Validation state for green check
    const valid = (name: keyof typeof form) => form[name] && !errors?.[name];
    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="First Name" id="first_name" error={errors?.first_name} valid={valid("first_name") as boolean}>
                <input id="first_name" name="first_name" type="text" value={form.first_name} onChange={onChange} placeholder="Juan" className={getInputClass(valid("first_name") as boolean, errors?.first_name)} />
            </Field>
            <Field label="Last Name" id="last_name" error={errors?.last_name} valid={valid("last_name") as boolean}>
                <input id="last_name" name="last_name" type="text" value={form.last_name} onChange={onChange} placeholder="Dela Cruz" className={getInputClass(valid("last_name") as boolean, errors?.last_name)} />
            </Field>
            <div>
                <DatePickerField
                    label="Birthdate"
                    id="birthdate"
                    value={form.birthdate}
                    onSelect={(date) => onFieldChange && onFieldChange("birthdate", date ? format(date, "yyyy-MM-dd") : "")}
                />
                {errors?.birthdate && <span className="text-xs text-red-500 font-medium mt-0.5">{errors.birthdate}</span>}
            </div>
            <Field label="Gender" id="gender" error={errors?.gender} valid={valid("gender") as boolean}>
                <InlineCombobox
                    id="gender"
                    value={form.gender || ""}
                    onChange={(val) => onFieldChange && onFieldChange("gender", val)}
                    options={["Male", "Female"]}
                    placeholder="Select gender"
                    className={getInputClass(valid("gender") as boolean, errors?.gender)}
                />
            </Field>
            <Field label="Marital Status" id="marital_status" error={errors?.marital_status} valid={valid("marital_status") as boolean}>
                <InlineCombobox
                    id="marital_status"
                    value={form.marital_status || ""}
                    onChange={(val) => onFieldChange && onFieldChange("marital_status", val)}
                    options={["Single", "Married", "Widowed", "Separated", "Divorced"]}
                    placeholder="Select marital status"
                    className={getInputClass(valid("marital_status") as boolean, errors?.marital_status)}
                />
            </Field>
            <Field label="Place of Birth" id="place_of_birth" error={errors?.place_of_birth} valid={valid("place_of_birth") as boolean}>
                <input id="place_of_birth" name="place_of_birth" type="text" value={form.place_of_birth} onChange={onChange} placeholder="City, Province" className={getInputClass(valid("place_of_birth") as boolean, errors?.place_of_birth)} />
            </Field>
            <Field label="Citizenship" id="citizenship" error={errors?.citizenship} valid={valid("citizenship") as boolean}>
                <input id="citizenship" name="citizenship" type="text" value={form.citizenship} onChange={onChange} placeholder="Filipino" className={getInputClass(valid("citizenship") as boolean, errors?.citizenship)} />
            </Field>
            <Field label="Nationality" id="nationality" error={errors?.nationality} valid={valid("nationality") as boolean}>
                <input id="nationality" name="nationality" type="text" value={form.nationality} onChange={onChange} placeholder="Filipino" className={getInputClass(valid("nationality") as boolean, errors?.nationality)} />
            </Field>
            <Field label="Religion" id="religion" error={errors?.religion} valid={valid("religion") as boolean}>
                <input id="religion" name="religion" type="text" value={form.religion} onChange={onChange} placeholder="Catholic" className={getInputClass(valid("religion") as boolean, errors?.religion)} />
            </Field>
            <Field label="Race" id="race" error={errors?.race} valid={valid("race") as boolean}>
                <input id="race" name="race" type="text" value={form.race} onChange={onChange} placeholder="Asian" className={getInputClass(valid("race") as boolean, errors?.race)} />
            </Field>
            <Field label="Occupation" id="occupation" error={errors?.occupation} valid={valid("occupation") as boolean}>
                <input id="occupation" name="occupation" type="text" value={form.occupation} onChange={onChange} placeholder="Farmer, Driver…" className={getInputClass(valid("occupation") as boolean, errors?.occupation)} />
            </Field>
            <Field label="No. of Children" id="no_of_children" error={errors?.no_of_children} valid={valid("no_of_children") as boolean}>
                <input id="no_of_children" name="no_of_children" type="number" min="0" value={form.no_of_children} onChange={onChange} placeholder="0" className={getInputClass(valid("no_of_children") as boolean, errors?.no_of_children)} />
            </Field>
        </div>
    );
}

function StepPhysical({ form, onChange, onFieldChange, errors }: StepProps) {
    const valid = (name: keyof typeof form) => form[name] && !errors?.[name];
    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Height (cm)" id="height_cm" error={errors?.height_cm} valid={valid("height_cm") as boolean}>
                <input id="height_cm" name="height_cm" type="number" step="0.01" value={form.height_cm} onChange={onChange} placeholder="172.50" className={getInputClass(valid("height_cm") as boolean, errors?.height_cm)} />
            </Field>
            <Field label="Weight (kg)" id="weight_kg" error={errors?.weight_kg} valid={valid("weight_kg") as boolean}>
                <input id="weight_kg" name="weight_kg" type="number" step="0.01" value={form.weight_kg} onChange={onChange} placeholder="65.00" className={getInputClass(valid("weight_kg") as boolean, errors?.weight_kg)} />
            </Field>
            <Field label="Hair Description" id="hair_description" error={errors?.hair_description} valid={valid("hair_description") as boolean}>
                <input id="hair_description" name="hair_description" type="text" value={form.hair_description} onChange={onChange} placeholder="Short, straight" className={getInputClass(valid("hair_description") as boolean, errors?.hair_description)} />
            </Field>
            <Field label="Hair Color" id="hair_color" error={errors?.hair_color} valid={valid("hair_color") as boolean}>
                <input id="hair_color" name="hair_color" type="text" value={form.hair_color} onChange={onChange} placeholder="Black" className={getInputClass(valid("hair_color") as boolean, errors?.hair_color)} />
            </Field>
            <Field label="Complexion" id="complexion" error={errors?.complexion} valid={valid("complexion") as boolean}>
                <input id="complexion" name="complexion" type="text" value={form.complexion} onChange={onChange} placeholder="Brown, fair…" className={getInputClass(valid("complexion") as boolean, errors?.complexion)} />
            </Field>
            <Field label="Eyes Description" id="eyes_description" error={errors?.eyes_description} valid={valid("eyes_description") as boolean}>
                <input id="eyes_description" name="eyes_description" type="text" value={form.eyes_description} onChange={onChange} placeholder="Almond-shaped" className={getInputClass(valid("eyes_description") as boolean, errors?.eyes_description)} />
            </Field>
            <Field label="Eye Color" id="eye_color" error={errors?.eye_color} valid={valid("eye_color") as boolean}>
                <input id="eye_color" name="eye_color" type="text" value={form.eye_color} onChange={onChange} placeholder="Brown" className={getInputClass(valid("eye_color") as boolean, errors?.eye_color)} />
            </Field>
            <Field label="Blood Type" id="blood_type" error={errors?.blood_type} valid={valid("blood_type") as boolean}>
                <InlineCombobox
                    id="blood_type"
                    value={form.blood_type || ""}
                    onChange={(val) => onFieldChange?.("blood_type", val)}
                    options={["A", "B", "AB", "O"]}
                    placeholder="Select blood type"
                    className={getInputClass(valid("blood_type") as boolean, errors?.blood_type)}
                />
            </Field>
            <div className="sm:col-span-2">
                <Field label="Identifying Marks" id="identifying_marks" error={errors?.identifying_marks} valid={valid("identifying_marks") as boolean}>
                    <textarea id="identifying_marks" name="identifying_marks" rows={3} value={form.identifying_marks} onChange={onChange} placeholder="Tattoos, scars, birthmarks…" className={getTextareaClass(valid("identifying_marks") as boolean, errors?.identifying_marks)} />
                </Field>
            </div>
        </div>
    );
}

function StepContact({ form, onChange, errors }: StepProps) {
    const valid = (name: keyof typeof form) => form[name] && !errors?.[name];
    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Contact Number" id="contact_number" error={errors?.contact_number} valid={valid("contact_number") as boolean}>
                <input id="contact_number" name="contact_number" type="text" value={form.contact_number} onChange={onChange} placeholder="09XX-XXX-XXXX" className={getInputClass(valid("contact_number") as boolean, errors?.contact_number)} />
            </Field>
            <Field label="Emergency Contact Name" id="emergency_contact_name" error={errors?.emergency_contact_name} valid={valid("emergency_contact_name") as boolean}>
                <input id="emergency_contact_name" name="emergency_contact_name" type="text" value={form.emergency_contact_name} onChange={onChange} placeholder="Full name" className={getInputClass(valid("emergency_contact_name") as boolean, errors?.emergency_contact_name)} />
            </Field>
            <Field label="Emergency Contact Number" id="emergency_contact_number" error={errors?.emergency_contact_number} valid={valid("emergency_contact_number") as boolean}>
                <input id="emergency_contact_number" name="emergency_contact_number" type="text" value={form.emergency_contact_number} onChange={onChange} placeholder="09XX-XXX-XXXX" className={getInputClass(valid("emergency_contact_number") as boolean, errors?.emergency_contact_number)} />
            </Field>
            <div className="sm:col-span-2">
                <Field label="Permanent Address" id="permanent_address" error={errors?.permanent_address} valid={valid("permanent_address") as boolean}>
                    <textarea id="permanent_address" name="permanent_address" rows={2} value={form.permanent_address} onChange={onChange} placeholder="Street, Barangay, City, Province" className={getTextareaClass(valid("permanent_address") as boolean, errors?.permanent_address)} />
                </Field>
            </div>
            <div className="sm:col-span-2">
                <Field label="Provincial Address" id="provincial_address" error={errors?.provincial_address} valid={valid("provincial_address") as boolean}>
                    <textarea id="provincial_address" name="provincial_address" rows={2} value={form.provincial_address} onChange={onChange} placeholder="Street, Barangay, City, Province" className={getTextareaClass(valid("provincial_address") as boolean, errors?.provincial_address)} />
                </Field>
            </div>
            <Field label="Father's Name" id="father_name" error={errors?.father_name} valid={valid("father_name") as boolean}>
                <input id="father_name" name="father_name" type="text" value={form.father_name} onChange={onChange} placeholder="Full name" className={getInputClass(valid("father_name") as boolean, errors?.father_name)} />
            </Field>
            <div className="sm:col-span-2">
                <Field label="Father's Address" id="father_address" error={errors?.father_address} valid={valid("father_address") as boolean}>
                    <textarea id="father_address" name="father_address" rows={2} value={form.father_address} onChange={onChange} placeholder="Address" className={getTextareaClass(valid("father_address") as boolean, errors?.father_address)} />
                </Field>
            </div>
            <Field label="Mother's Name" id="mother_name" error={errors?.mother_name} valid={valid("mother_name") as boolean}>
                <input id="mother_name" name="mother_name" type="text" value={form.mother_name} onChange={onChange} placeholder="Full name" className={getInputClass(valid("mother_name") as boolean, errors?.mother_name)} />
            </Field>
            <div className="sm:col-span-2">
                <Field label="Mother's Address" id="mother_address" error={errors?.mother_address} valid={valid("mother_address") as boolean}>
                    <textarea id="mother_address" name="mother_address" rows={2} value={form.mother_address} onChange={onChange} placeholder="Address" className={getTextareaClass(valid("mother_address") as boolean, errors?.mother_address)} />
                </Field>
            </div>
            <Field label="Wife / CLW Name" id="wife_clw_name" error={errors?.wife_clw_name} valid={valid("wife_clw_name") as boolean}>
                <input id="wife_clw_name" name="wife_clw_name" type="text" value={form.wife_clw_name} onChange={onChange} placeholder="Full name (if applicable)" className={getInputClass(valid("wife_clw_name") as boolean, errors?.wife_clw_name)} />
            </Field>
            <div className="sm:col-span-2">
                <Field label="Wife / CLW Address" id="wife_clw_address" error={errors?.wife_clw_address} valid={valid("wife_clw_address") as boolean}>
                    <textarea id="wife_clw_address" name="wife_clw_address" rows={2} value={form.wife_clw_address} onChange={onChange} placeholder="Address" className={getTextareaClass(valid("wife_clw_address") as boolean, errors?.wife_clw_address)} />
                </Field>
            </div>
            <Field label="Relative Name" id="relative_name" error={errors?.relative_name} valid={valid("relative_name") as boolean}>
                <input id="relative_name" name="relative_name" type="text" value={form.relative_name} onChange={onChange} placeholder="Full name" className={getInputClass(valid("relative_name") as boolean, errors?.relative_name)} />
            </Field>
            <div className="sm:col-span-2">
                <Field label="Relative's Address" id="relative_address" error={errors?.relative_address} valid={valid("relative_address") as boolean}>
                    <textarea id="relative_address" name="relative_address" rows={2} value={form.relative_address} onChange={onChange} placeholder="Address" className={getTextareaClass(valid("relative_address") as boolean, errors?.relative_address)} />
                </Field>
            </div>
        </div>
    );
}

function StepEducation({ form, onChange, errors }: StepProps) {
    // Helper to create a synthetic event for onChange
    function createChangeEvent(name: string, value: string): React.ChangeEvent<HTMLInputElement> {
        return {
            target: { name, value }
        } as React.ChangeEvent<HTMLInputElement>;
    }
    const valid = (name: keyof typeof form) => form[name] && !errors?.[name];
    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Educational Attainment" id="educational_attainment" error={errors?.educational_attainment} valid={valid("educational_attainment") as boolean}>
                <DegreeCombobox
                    value={form.educational_attainment}
                    onValueChange={(val: string) => onChange(createChangeEvent("educational_attainment", val))}
                />
            </Field>
            <Field label="Course / Degree" id="course" error={errors?.course} valid={valid("course") as boolean}>
                <CourseCombobox
                    value={form.course}
                    onValueChange={(val: string) => onChange(createChangeEvent("course", val))}
                />
            </Field>
            <div className="sm:col-span-2">
                <Field label="School Attended" id="school_attended" error={errors?.school_attended} valid={valid("school_attended") as boolean}>
                    <input id="school_attended" name="school_attended" type="text" value={form.school_attended} onChange={onChange} placeholder="Name of school / university" className={getInputClass(valid("school_attended") as boolean, errors?.school_attended)} />
                </Field>
            </div>
        </div>
    );
}

function StepCase({ form, onChange, onFieldChange, errors }: StepProps) {
    const valid = (name: keyof typeof form) => form[name] && !errors?.[name];
    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
                <Field label="Crime" id="crime" error={errors?.crime} valid={valid("crime") as boolean}>
                    <textarea id="crime" name="crime" rows={2} value={form.crime} onChange={onChange} placeholder="Describe the crime" className={getTextareaClass(valid("crime") as boolean, errors?.crime)} />
                </Field>
            </div>
            <div className="sm:col-span-2">
                <Field label="Offense Charged" id="offense_charged" error={errors?.offense_charged} valid={valid("offense_charged") as boolean}>
                    <textarea id="offense_charged" name="offense_charged" rows={2} value={form.offense_charged} onChange={onChange} placeholder="Specific offense charged" className={getTextareaClass(valid("offense_charged") as boolean, errors?.offense_charged)} />
                </Field>
            </div>
            <Field label="Criminal Case Number" id="criminal_case_number" error={errors?.criminal_case_number} valid={valid("criminal_case_number") as boolean}>
                <input id="criminal_case_number" name="criminal_case_number" type="text" value={form.criminal_case_number} onChange={onChange} placeholder="CC-2024-0001" className={getInputClass(valid("criminal_case_number") as boolean, errors?.criminal_case_number)} />
            </Field>
            <Field label="Sentence (Years)" id="sentence_years" error={errors?.sentence_years} valid={valid("sentence_years") as boolean}>
                <input id="sentence_years" name="sentence_years" type="number" min="0" value={form.sentence_years} onChange={onChange} placeholder="5" className={getInputClass(valid("sentence_years") as boolean, errors?.sentence_years)} />
            </Field>
            <div className="sm:col-span-2">
                <Field label="Court Details" id="court_details" error={errors?.court_details} valid={valid("court_details") as boolean}>
                    <textarea id="court_details" name="court_details" rows={2} value={form.court_details} onChange={onChange} placeholder="RTC Branch, City" className={getTextareaClass(valid("court_details") as boolean, errors?.court_details)} />
                </Field>
            </div>
            <Field label="Case Court" id="case_court" error={errors?.case_court} valid={valid("case_court") as boolean}>
                <input id="case_court" name="case_court" type="text" value={form.case_court} onChange={onChange} placeholder="RTC Branch 1 – Manila" className={getInputClass(valid("case_court") as boolean, errors?.case_court)} />
            </Field>
            <Field label="Case Status" id="case_status" error={errors?.case_status} valid={valid("case_status") as boolean}>
                <input id="case_status" name="case_status" type="text" value={form.case_status} onChange={onChange} placeholder="Pending, Decided…" className={getInputClass(valid("case_status") as boolean, errors?.case_status)} />
            </Field>
            <Field label="Cell Block" id="cell_block" error={errors?.cell_block} valid={valid("cell_block") as boolean}>
                <input id="cell_block" name="cell_block" type="text" value={form.cell_block} onChange={onChange} placeholder="Block A" className={getInputClass(valid("cell_block") as boolean, errors?.cell_block)} />
            </Field>
            <Field label="Inmate Status" id="status" error={errors?.status} valid={valid("status") as boolean}>
                <InlineCombobox
                    id="status"
                    value={form.status || ""}
                    onChange={(val) => onFieldChange?.("status", val)}
                    options={["Active", "Released", "Transferred"]}
                    placeholder="Select status"
                    className={getInputClass(valid("status") as boolean, errors?.status)}
                />
            </Field>
            <DatePickerField
                label="Admission Date"
                id="admission_date"
                value={form.admission_date}
                onSelect={(date) => onFieldChange?.("admission_date", date ? format(date, "yyyy-MM-dd") : "")}
            />
            <DatePickerField
                label="Release Date"
                id="release_date"
                value={form.release_date}
                onSelect={(date) => onFieldChange?.("release_date", date ? format(date, "yyyy-MM-dd") : "")}
            />
            <Field label="Return Rate" id="return_rate" error={errors?.return_rate} valid={valid("return_rate") as boolean}>
                <input id="return_rate" name="return_rate" type="text" value={form.return_rate} onChange={onChange} placeholder="Low / Medium / High" className={getInputClass(valid("return_rate") as boolean, errors?.return_rate)} />
            </Field>
            <DateTimePickerField
                label="Date & Time Received"
                id="date_time_received"
                value={form.date_time_received}
                onChange={(nextValue) => onFieldChange?.("date_time_received", nextValue)}
            />
            <Field label="Turned Over By" id="turned_over_by" error={errors?.turned_over_by} valid={valid("turned_over_by") as boolean}>
                <input id="turned_over_by" name="turned_over_by" type="text" value={form.turned_over_by} onChange={onChange} placeholder="Officer name" className={getInputClass(valid("turned_over_by") as boolean, errors?.turned_over_by)} />
            </Field>
            <Field label="Receiving Duty Officer" id="receiving_duty_officer" error={errors?.receiving_duty_officer} valid={valid("receiving_duty_officer") as boolean}>
                <input id="receiving_duty_officer" name="receiving_duty_officer" type="text" value={form.receiving_duty_officer} onChange={onChange} placeholder="Officer name" className={getInputClass(valid("receiving_duty_officer") as boolean, errors?.receiving_duty_officer)} />
            </Field>
        </div>
    );
}

function StepProperty({ form, onChange, onFieldChange, errors, onFileChange }: StepProps & { onFileChange?: (file: File) => void }) {
    const [preview, setPreview] = useState<string | null>(form.photo_path ? form.photo_path : null);

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files && e.target.files[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setPreview(url);
            onFileChange?.(file);
            onFieldChange?.("photo_path", file.name); // Store filename temporarily
        }
    }

    const valid = (name: keyof typeof form) => form[name] && !errors?.[name];

    return (
        <div className="flex flex-col gap-6">
            {/* Image preview at the top */}
            <div className="flex justify-center">
                {preview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={preview}
                        alt="Inmate Preview"
                        className="h-48 w-48 object-cover rounded-lg border-4 border-white shadow-md"
                    />
                ) : (
                    <div className="h-48 w-48 flex items-center justify-center bg-slate-100 rounded-lg text-slate-400 text-sm italic">No photo</div>
                )}
            </div>
            {/* File input and fields below */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2 flex flex-col gap-2">
                    <label htmlFor="photo_path" className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Photo (ID Type Layout)</label>
                    <input
                        id="photo_path"
                        name="photo_path"
                        type="file"
                        accept="image/*"
                        className="block w-full text-sm text-slate-700 cursor-pointer file:cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
                        onChange={handleFileChange}
                    />
                </div>
                <div className="sm:col-span-2">
                    <Field label="Prisoner Property" id="prisoner_property" error={errors?.prisoner_property} valid={valid("prisoner_property") as boolean}>
                        <textarea id="prisoner_property" name="prisoner_property" rows={3} value={form.prisoner_property} onChange={onChange} placeholder="List of belongings confiscated…" className={getTextareaClass(valid("prisoner_property") as boolean, errors?.prisoner_property)} />
                    </Field>
                </div>
                <Field label="Property Receipt Number" id="property_receipt_number" error={errors?.property_receipt_number} valid={valid("property_receipt_number") as boolean}>
                    <input id="property_receipt_number" name="property_receipt_number" type="text" value={form.property_receipt_number} onChange={onChange} placeholder="PR-2024-0001" className={getInputClass(valid("property_receipt_number") as boolean, errors?.property_receipt_number)} />
                </Field>
            </div>
        </div>
    );
}

const STEP_COMPONENTS: Array<(props: StepProps) => React.JSX.Element> = [
    StepPersonal,
    StepPhysical,
    StepContact,
    StepEducation,
    StepCase,
    StepProperty,
];

// ─── Main Modal ───────────────────────────────────────────────────────────────


// ─── Validation ─────────────────────────────────────────────────────────────
type ValidationErrors = Partial<Record<keyof InmateForm, string>>;

function validateField(name: keyof InmateForm, value: string): string {
    switch (name) {
        case "first_name":
        case "last_name":
            if (value && !/^[A-Za-z\s\-'.]+$/.test(value)) return "Only letters and common name characters allowed.";
            break;
        case "contact_number":
            if (value && !/^09\d{9}$/.test(value.replace(/[^\d]/g, ""))) return "Format: 09XXXXXXXXX";
            break;
        case "emergency_contact_number":
            if (value && !/^09\d{9}$/.test(value.replace(/[^\d]/g, ""))) return "Format: 09XXXXXXXXX";
            break;
        default:
            break;
    }
    return "";
}

function validateForm(form: InmateForm): ValidationErrors {
    const errors: ValidationErrors = {};
    (Object.keys(form) as (keyof InmateForm)[]).forEach((key) => {
        const error = validateField(key, form[key] || "");
        if (error) errors[key] = error;
    });
    return errors;
}

// Helper to format values for Supabase
function formatValue(key: keyof InmateForm, value: string) {
    if (value === "") return null;
    // Numeric fields
    if (["height_cm", "weight_kg", "no_of_children", "sentence_years"].includes(key)) {
        const num = Number(value);
        return isNaN(num) ? null : num;
    }
    // Date fields (YYYY-MM-DD or ISO)
    if (["birthdate", "admission_date", "release_date"].includes(key)) {
        // Accept only valid date strings
        if (!value) return null;
        const d = new Date(value);
        return isNaN(d.getTime()) ? null : value;
    }
    // Timestamp field
    if (key === "date_time_received") {
        if (!value) return null;
        const d = new Date(value);
        return isNaN(d.getTime()) ? null : d.toISOString();
    }
    // Enum fields
    if (key === "gender" && !["Male", "Female"].includes(value)) return null;
    if (key === "status" && !["Active", "Released", "Transferred"].includes(value)) return null;
    if (key === "blood_type" && !["A", "B", "AB", "O"].includes(value)) return null;
    return value;
}

export default function AddInmateModal({ isOpen, onClose, onSubmit }: AddInmateModalProps) {

    const [form, setForm] = useState<InmateForm>(INITIAL_FORM);
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 1 });
    const [errors, setErrors] = useState<ValidationErrors>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            // No need for manual body overflow management with shadcn Dialog
        } else {
            setForm(INITIAL_FORM);
            setPagination({ pageIndex: 0, pageSize: 1 });
            setErrors({});
            setPhotoFile(null);
        }
    }, [isOpen]);

    const currentStep = pagination.pageIndex;
    const totalSteps = STEPS.length;
    const isFirstStep = currentStep === 0;
    const isLastStep = currentStep === totalSteps - 1;

    const handleChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
            const { name, value } = e.target;
            setForm((prev) => ({ ...prev, [name]: value }));
            setErrors((prev) => ({ ...prev, [name]: validateField(name as keyof InmateForm, value) }));
        },
        []
    );

    const handleFieldChange = useCallback(
        (name: keyof InmateForm, value: string) => {
            setForm((prev) => ({ ...prev, [name]: value }));
            setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
        },
        []
    );

    const goNext = useCallback(() => {
        if (!isLastStep) {
            setPagination((prev) => ({ ...prev, pageIndex: prev.pageIndex + 1 }));
        }
    }, [isLastStep]);

    const goPrev = useCallback(() => {
        if (!isFirstStep) {
            setPagination((prev) => ({ ...prev, pageIndex: prev.pageIndex - 1 }));
        }
    }, [isFirstStep]);


    const handleClose = useCallback(() => {
        setForm(INITIAL_FORM);
        setPagination({ pageIndex: 0, pageSize: 1 });
        setErrors({});
        onClose();
    }, [onClose]);

    const handleSubmit = useCallback(() => {
        const validation = validateForm(form);
        setErrors(validation);
        if (Object.keys(validation).length > 0) {
            toast.error("Please fix the validation errors before submitting.");
            return;
        }

        // Prepare payload with correct formatting for Supabase
        const payload: Record<string, unknown> = {};
        Object.keys(form).forEach((key) => {
            payload[key] = formatValue(key as keyof InmateForm, form[key as keyof InmateForm]);
        });

        (async () => {
            setIsSubmitting(true);
            try {
                let finalPhotoPath = form.photo_path;

                if (photoFile) {
                    try {
                        const fileExt = photoFile.name.split('.').pop();
                        const fileName = `inmate-${Date.now()}.${fileExt}`;
                        const filePath = `photos/${fileName}`;

                        const { error: uploadError } = await supabase.storage
                            .from("inmate-photos")
                            .upload(filePath, photoFile);

                        if (uploadError) {
                            const isBucketNotFound = uploadError.message.toLowerCase().includes("bucket not found") || 
                                                     ('status' in uploadError && (uploadError as { status: number }).status === 400);
                            
                            if (isBucketNotFound) {
                                throw new Error("Storage bucket 'inmate-photos' not found. Please ensure it exists in your Supabase project.");
                            }
                            throw uploadError;
                        }

                        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
                        const publicUrl = `${supabaseUrl}/storage/v1/object/public/inmate-photos/${filePath}`;
                        
                        finalPhotoPath = publicUrl;
                    } catch (uploadError: unknown) {
                        toast.error(`Photo upload failed: ${(uploadError as Error).message}`);
                        setIsSubmitting(false);
                        return;
                    }
                }

                const finalPayload = { ...payload, photo_path: finalPhotoPath };

                const { error } = await supabase.from("inmates").insert([finalPayload]);
                if (error) {
                    setErrors((prev) => ({ ...prev, submit: error.message }));
                    toast.error(`Failed to add inmate: ${error.message}`);
                    return;
                }
                toast.success("Inmate added successfully!");
                onSubmit(form);
                handleClose();
            } catch (err) {
                console.error("Submission error:", err);
                toast.error("An unexpected error occurred.");
            } finally {
                setIsSubmitting(false);
            }
        })();
    }, [form, handleClose, onSubmit, photoFile]);

    const StepComponent = STEP_COMPONENTS[currentStep];
    const { title: stepTitle, icon: StepIcon } = STEPS[currentStep];

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <DialogContent 
                className="flex w-full max-w-5xl min-w-200 h-162.5 flex-col rounded-2xl bg-white shadow-2xl overflow-hidden p-0 border-none"
                showCloseButton={false}
            >
                {/* ── Header ─────────────────────────────────────────────── */}
                <div className="flex items-center justify-between border-b border-slate-200 bg-teal-700 px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
                            <StepIcon size={18} className="text-white" />
                        </div>
                        <div>
                            <p id="modal-title" className="font-lexend text-lg font-semibold text-white leading-tight">
                                Add New Inmate
                            </p>
                            <p className="text-xs text-teal-100">
                                Step {currentStep + 1} of {totalSteps} — {stepTitle}
                            </p>
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

                {/* ── Step Indicator ─────────────────────────────────────── */}
                <div className="flex items-center justify-center gap-x-3 border-b border-slate-100 bg-slate-50 px-6 py-3">
                    {STEPS.map((step, idx) => {
                        const Icon = step.icon;
                        const isCompleted = idx < currentStep;
                        const isActive = idx === currentStep;
                        return (
                            <div key={step.title} className="flex items-center gap-x-3 flex-none">
                                <button
                                    type="button"
                                    title={step.title}
                                    onClick={() => setPagination((prev) => ({ ...prev, pageIndex: idx }))}
                                    className={`cursor-pointer flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition
                                        ${isCompleted ? "bg-teal-600 text-white" : isActive ? "bg-teal-700 text-white ring-2 ring-teal-300" : "bg-slate-200 text-slate-500 hover:bg-slate-300"}`}
                                >
                                    {isCompleted ? <Check size={13} /> : <Icon size={15} />}
                                </button>
                                {idx < STEPS.length - 1 && (
                                    <div
                                        className={`w-8 sm:w-12 h-0.5 rounded transition-colors ${isCompleted ? "bg-teal-500" : "bg-slate-200"}`}
                                    />
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* ── Body (scrollable) ──────────────────────────────────── */}
                <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5">
                    <StepComponent 
                        form={form} 
                        onChange={handleChange} 
                        onFieldChange={handleFieldChange} 
                        errors={errors} 
                        {...(currentStep === 5 ? { onFileChange: setPhotoFile } : {})} 
                    />
                </div>

                {/* ── Footer ─────────────────────────────────────────────── */}
                <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-4">
                    <button
                        type="button"
                        onClick={goPrev}
                        disabled={isFirstStep}
                        className="cursor-pointer flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        <ChevronLeft size={16} />
                        Previous
                    </button>

                    <span className="text-xs text-slate-400 font-medium">
                        {currentStep + 1} / {totalSteps}
                    </span>

                    {isLastStep ? (
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="cursor-pointer flex items-center gap-1.5 rounded-lg bg-teal-700 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 disabled:opacity-50"
                        >
                            <Check size={16} />
                            {isSubmitting ? "Submitting..." : "Submit"}
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={goNext}
                            className="cursor-pointer flex items-center gap-1.5 rounded-lg bg-teal-700 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800"
                        >
                            Next
                            <ChevronRight size={16} />
                        </button>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
