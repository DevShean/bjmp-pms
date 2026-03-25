"use client";

import { useState, useCallback, useEffect } from "react";
import type { PaginationState } from "@tanstack/react-table";
import { AnimatePresence, motion } from "motion/react";
import { format } from "date-fns";
import { X, User, Activity, Phone, GraduationCap, Scale, Package, CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DegreeCombobox from "../../components/DegreeCombobox";
import CourseCombobox from "../../components/CourseCombobox";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Check as CheckIcon } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type InmateGender = "Male" | "Female";
type InmateStatus = "Active" | "Released" | "Transferred";
type BloodType = "A" | "B" | "AB" | "O";

type InmateForm = {
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
    height_cm: string;
    weight_kg: string;
    hair_description: string;
    hair_color: string;
    complexion: string;
    eyes_description: string;
    eye_color: string;
    blood_type: BloodType | "";
    identifying_marks: string;
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
    educational_attainment: string;
    course: string;
    school_attended: string;
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

const STEPS = [
    { title: "Personal Information",   icon: User },
    { title: "Physical Description",   icon: Activity },
    { title: "Contact & Family",       icon: Phone },
    { title: "Educational Background", icon: GraduationCap },
    { title: "Case & Legal",           icon: Scale },
    { title: "Property & Photo",       icon: Package },
] as const;

// ─── Shared UI Logic (Mirroring AddInmateModal) ──────────────────────────────

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

// ─── Step Renderers ───────────────────────────────────────────────────────────

interface StepProps {
    form: InmateForm;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
    onFieldChange?: (name: keyof InmateForm, value: string) => void;
    errors?: Partial<Record<keyof InmateForm, string>>;
}

function DatePickerField({ label, id, value, onSelect }: {
    label: string;
    id: string;
    value: string;
    onSelect: (date: Date | undefined) => void;
}) {
    const selected = value ? new Date(value + "T12:00:00") : undefined;
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
                        fromYear={1900}
                        toYear={2100}
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
    const selectedTime = value ? (value.includes("T") ? value.slice(11, 16) : "") : "";

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
        if (selectedDate) {
            onChange(`${format(selectedDate, "yyyy-MM-dd")}T${nextTime}`);
        } else {
            onChange(`${format(new Date(), "yyyy-MM-dd")}T${nextTime}`);
        }
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
                            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">Time</label>
                            <input
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
    const valid = (name: keyof typeof form) => form[name] && !errors?.[name];
    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="First Name" id="first_name" error={errors?.first_name} valid={valid("first_name") as boolean}>
                <input id="first_name" name="first_name" type="text" value={form.first_name} onChange={onChange} className={getInputClass(valid("first_name") as boolean, errors?.first_name)} />
            </Field>
            <Field label="Last Name" id="last_name" error={errors?.last_name} valid={valid("last_name") as boolean}>
                <input id="last_name" name="last_name" type="text" value={form.last_name} onChange={onChange} className={getInputClass(valid("last_name") as boolean, errors?.last_name)} />
            </Field>
            <div>
                <DatePickerField
                    label="Birthdate"
                    id="birthdate"
                    value={form.birthdate}
                    onSelect={(date) => onFieldChange?.("birthdate", date ? format(date, "yyyy-MM-dd") : "")}
                />
                {errors?.birthdate && <span className="text-xs text-red-500 font-medium mt-0.5">{errors.birthdate}</span>}
            </div>
            <Field label="Gender" id="gender" error={errors?.gender} valid={valid("gender") as boolean}>
                <Select value={form.gender || ""} onValueChange={(val) => onFieldChange?.("gender", val ?? "")}>
                    <SelectTrigger className={getInputClass(valid("gender") as boolean, errors?.gender)}>
                        <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                    </SelectContent>
                </Select>
            </Field>
            <Field label="Marital Status" id="marital_status" error={errors?.marital_status} valid={valid("marital_status") as boolean}>
                <Select value={form.marital_status || ""} onValueChange={(val) => onFieldChange?.("marital_status", val ?? "")}>
                    <SelectTrigger className={getInputClass(valid("marital_status") as boolean, errors?.marital_status)}>
                        <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                        {["Single", "Married", "Widowed", "Separated", "Divorced"].map((s) => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </Field>
            <Field label="Place of Birth" id="place_of_birth" error={errors?.place_of_birth} valid={valid("place_of_birth") as boolean}>
                <input id="place_of_birth" name="place_of_birth" type="text" value={form.place_of_birth} onChange={onChange} className={getInputClass(valid("place_of_birth") as boolean, errors?.place_of_birth)} />
            </Field>
            <Field label="Citizenship" id="citizenship" error={errors?.citizenship} valid={valid("citizenship") as boolean}>
                <input id="citizenship" name="citizenship" type="text" value={form.citizenship} onChange={onChange} className={getInputClass(valid("citizenship") as boolean, errors?.citizenship)} />
            </Field>
            <Field label="Nationality" id="nationality" error={errors?.nationality} valid={valid("nationality") as boolean}>
                <input id="nationality" name="nationality" type="text" value={form.nationality} onChange={onChange} className={getInputClass(valid("nationality") as boolean, errors?.nationality)} />
            </Field>
            <Field label="Religion" id="religion" error={errors?.religion} valid={valid("religion") as boolean}>
                <input id="religion" name="religion" type="text" value={form.religion} onChange={onChange} className={getInputClass(valid("religion") as boolean, errors?.religion)} />
            </Field>
            <Field label="Race" id="race" error={errors?.race} valid={valid("race") as boolean}>
                <input id="race" name="race" type="text" value={form.race} onChange={onChange} className={getInputClass(valid("race") as boolean, errors?.race)} />
            </Field>
            <Field label="Occupation" id="occupation" error={errors?.occupation} valid={valid("occupation") as boolean}>
                <input id="occupation" name="occupation" type="text" value={form.occupation} onChange={onChange} className={getInputClass(valid("occupation") as boolean, errors?.occupation)} />
            </Field>
            <Field label="No. of Children" id="no_of_children" error={errors?.no_of_children} valid={valid("no_of_children") as boolean}>
                <input id="no_of_children" name="no_of_children" type="number" value={form.no_of_children} onChange={onChange} className={getInputClass(valid("no_of_children") as boolean, errors?.no_of_children)} />
            </Field>
        </div>
    );
}

function StepPhysical({ form, onChange, onFieldChange, errors }: StepProps) {
    const valid = (name: keyof typeof form) => form[name] && !errors?.[name];
    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Height (cm)" id="height_cm" error={errors?.height_cm} valid={valid("height_cm") as boolean}>
                <input id="height_cm" name="height_cm" type="number" step="0.01" value={form.height_cm} onChange={onChange} className={getInputClass(valid("height_cm") as boolean, errors?.height_cm)} />
            </Field>
            <Field label="Weight (kg)" id="weight_kg" error={errors?.weight_kg} valid={valid("weight_kg") as boolean}>
                <input id="weight_kg" name="weight_kg" type="number" step="0.01" value={form.weight_kg} onChange={onChange} className={getInputClass(valid("weight_kg") as boolean, errors?.weight_kg)} />
            </Field>
            <Field label="Hair Description" id="hair_description" error={errors?.hair_description} valid={valid("hair_description") as boolean}>
                <input id="hair_description" name="hair_description" type="text" value={form.hair_description} onChange={onChange} className={getInputClass(valid("hair_description") as boolean, errors?.hair_description)} />
            </Field>
            <Field label="Hair Color" id="hair_color" error={errors?.hair_color} valid={valid("hair_color") as boolean}>
                <input id="hair_color" name="hair_color" type="text" value={form.hair_color} onChange={onChange} className={getInputClass(valid("hair_color") as boolean, errors?.hair_color)} />
            </Field>
            <Field label="Complexion" id="complexion" error={errors?.complexion} valid={valid("complexion") as boolean}>
                <input id="complexion" name="complexion" type="text" value={form.complexion} onChange={onChange} className={getInputClass(valid("complexion") as boolean, errors?.complexion)} />
            </Field>
            <Field label="Eyes Description" id="eyes_description" error={errors?.eyes_description} valid={valid("eyes_description") as boolean}>
                <input id="eyes_description" name="eyes_description" type="text" value={form.eyes_description} onChange={onChange} className={getInputClass(valid("eyes_description") as boolean, errors?.eyes_description)} />
            </Field>
            <Field label="Eye Color" id="eye_color" error={errors?.eye_color} valid={valid("eye_color") as boolean}>
                <input id="eye_color" name="eye_color" type="text" value={form.eye_color} onChange={onChange} className={getInputClass(valid("eye_color") as boolean, errors?.eye_color)} />
            </Field>
            <Field label="Blood Type" id="blood_type" error={errors?.blood_type} valid={valid("blood_type") as boolean}>
                <Select value={form.blood_type || ""} onValueChange={(val) => onFieldChange?.("blood_type", val ?? "")}>
                    <SelectTrigger className={getInputClass(valid("blood_type") as boolean, errors?.blood_type)}>
                        <SelectValue placeholder="Select blood type" />
                    </SelectTrigger>
                    <SelectContent>
                        {["A", "B", "AB", "O"].map((bt) => (
                            <SelectItem key={bt} value={bt}>{bt}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </Field>
            <div className="sm:col-span-2">
                <Field label="Identifying Marks" id="identifying_marks" error={errors?.identifying_marks} valid={valid("identifying_marks") as boolean}>
                    <textarea id="identifying_marks" name="identifying_marks" rows={3} value={form.identifying_marks} onChange={onChange} className={getTextareaClass(valid("identifying_marks") as boolean, errors?.identifying_marks)} />
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
                <input id="contact_number" name="contact_number" type="text" value={form.contact_number} onChange={onChange} className={getInputClass(valid("contact_number") as boolean, errors?.contact_number)} />
            </Field>
            <Field label="Emergency Contact Name" id="emergency_contact_name" error={errors?.emergency_contact_name} valid={valid("emergency_contact_name") as boolean}>
                <input id="emergency_contact_name" name="emergency_contact_name" type="text" value={form.emergency_contact_name} onChange={onChange} className={getInputClass(valid("emergency_contact_name") as boolean, errors?.emergency_contact_name)} />
            </Field>
            <Field label="Emergency Contact Number" id="emergency_contact_number" error={errors?.emergency_contact_number} valid={valid("emergency_contact_number") as boolean}>
                <input id="emergency_contact_number" name="emergency_contact_number" type="text" value={form.emergency_contact_number} onChange={onChange} className={getInputClass(valid("emergency_contact_number") as boolean, errors?.emergency_contact_number)} />
            </Field>
            <div className="sm:col-span-2">
                <Field label="Permanent Address" id="permanent_address" error={errors?.permanent_address} valid={valid("permanent_address") as boolean}>
                    <textarea id="permanent_address" name="permanent_address" rows={2} value={form.permanent_address} onChange={onChange} className={getTextareaClass(valid("permanent_address") as boolean, errors?.permanent_address)} />
                </Field>
            </div>
            <div className="sm:col-span-2">
                <Field label="Provincial Address" id="provincial_address" error={errors?.provincial_address} valid={valid("provincial_address") as boolean}>
                    <textarea id="provincial_address" name="provincial_address" rows={2} value={form.provincial_address} onChange={onChange} className={getTextareaClass(valid("provincial_address") as boolean, errors?.provincial_address)} />
                </Field>
            </div>
            <Field label="Father's Name" id="father_name" error={errors?.father_name} valid={valid("father_name") as boolean}>
                <input id="father_name" name="father_name" type="text" value={form.father_name} onChange={onChange} className={getInputClass(valid("father_name") as boolean, errors?.father_name)} />
            </Field>
            <div className="sm:col-span-2">
                <Field label="Father's Address" id="father_address" error={errors?.father_address} valid={valid("father_address") as boolean}>
                    <textarea id="father_address" name="father_address" rows={2} value={form.father_address} onChange={onChange} className={getTextareaClass(valid("father_address") as boolean, errors?.father_address)} />
                </Field>
            </div>
            <Field label="Mother's Name" id="mother_name" error={errors?.mother_name} valid={valid("mother_name") as boolean}>
                <input id="mother_name" name="mother_name" type="text" value={form.mother_name} onChange={onChange} className={getInputClass(valid("mother_name") as boolean, errors?.mother_name)} />
            </Field>
            <div className="sm:col-span-2">
                <Field label="Mother's Address" id="mother_address" error={errors?.mother_address} valid={valid("mother_address") as boolean}>
                    <textarea id="mother_address" name="mother_address" rows={2} value={form.mother_address} onChange={onChange} className={getTextareaClass(valid("mother_address") as boolean, errors?.mother_address)} />
                </Field>
            </div>
            <Field label="Wife / CLW Name" id="wife_clw_name" error={errors?.wife_clw_name} valid={valid("wife_clw_name") as boolean}>
                <input id="wife_clw_name" name="wife_clw_name" type="text" value={form.wife_clw_name} onChange={onChange} className={getInputClass(valid("wife_clw_name") as boolean, errors?.wife_clw_name)} />
            </Field>
            <div className="sm:col-span-2">
                <Field label="Wife / CLW Address" id="wife_clw_address" error={errors?.wife_clw_address} valid={valid("wife_clw_address") as boolean}>
                    <textarea id="wife_clw_address" name="wife_clw_address" rows={2} value={form.wife_clw_address} onChange={onChange} className={getTextareaClass(valid("wife_clw_address") as boolean, errors?.wife_clw_address)} />
                </Field>
            </div>
            <Field label="Relative Name" id="relative_name" error={errors?.relative_name} valid={valid("relative_name") as boolean}>
                <input id="relative_name" name="relative_name" type="text" value={form.relative_name} onChange={onChange} className={getInputClass(valid("relative_name") as boolean, errors?.relative_name)} />
            </Field>
            <div className="sm:col-span-2">
                <Field label="Relative's Address" id="relative_address" error={errors?.relative_address} valid={valid("relative_address") as boolean}>
                    <textarea id="relative_address" name="relative_address" rows={2} value={form.relative_address} onChange={onChange} className={getTextareaClass(valid("relative_address") as boolean, errors?.relative_address)} />
                </Field>
            </div>
        </div>
    );
}

function StepEducation({ form, onChange, errors }: StepProps) {
    function createChangeEvent(name: string, value: string): React.ChangeEvent<HTMLInputElement> {
        return { target: { name, value } } as React.ChangeEvent<HTMLInputElement>;
    }
    const valid = (name: keyof typeof form) => form[name] && !errors?.[name];
    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Educational Attainment" id="educational_attainment" error={errors?.educational_attainment} valid={valid("educational_attainment") as boolean}>
                <DegreeCombobox value={form.educational_attainment} onValueChange={(val: string) => onChange(createChangeEvent("educational_attainment", val))} />
            </Field>
            <Field label="Course / Degree" id="course" error={errors?.course} valid={valid("course") as boolean}>
                <CourseCombobox value={form.course} onValueChange={(val: string) => onChange(createChangeEvent("course", val))} />
            </Field>
            <div className="sm:col-span-2">
                <Field label="School Attended" id="school_attended" error={errors?.school_attended} valid={valid("school_attended") as boolean}>
                    <input id="school_attended" name="school_attended" type="text" value={form.school_attended} onChange={onChange} className={getInputClass(valid("school_attended") as boolean, errors?.school_attended)} />
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
                    <textarea id="crime" name="crime" rows={2} value={form.crime} onChange={onChange} className={getTextareaClass(valid("crime") as boolean, errors?.crime)} />
                </Field>
            </div>
            <div className="sm:col-span-2">
                <Field label="Offense Charged" id="offense_charged" error={errors?.offense_charged} valid={valid("offense_charged") as boolean}>
                    <textarea id="offense_charged" name="offense_charged" rows={2} value={form.offense_charged} onChange={onChange} className={getTextareaClass(valid("offense_charged") as boolean, errors?.offense_charged)} />
                </Field>
            </div>
            <Field label="Criminal Case Number" id="criminal_case_number" error={errors?.criminal_case_number} valid={valid("criminal_case_number") as boolean}>
                <input id="criminal_case_number" name="criminal_case_number" type="text" value={form.criminal_case_number} onChange={onChange} className={getInputClass(valid("criminal_case_number") as boolean, errors?.criminal_case_number)} />
            </Field>
            <Field label="Sentence (Years)" id="sentence_years" error={errors?.sentence_years} valid={valid("sentence_years") as boolean}>
                <input id="sentence_years" name="sentence_years" type="number" value={form.sentence_years} onChange={onChange} className={getInputClass(valid("sentence_years") as boolean, errors?.sentence_years)} />
            </Field>
            <div className="sm:col-span-2">
                <Field label="Court Details" id="court_details" error={errors?.court_details} valid={valid("court_details") as boolean}>
                    <textarea id="court_details" name="court_details" rows={2} value={form.court_details} onChange={onChange} className={getTextareaClass(valid("court_details") as boolean, errors?.court_details)} />
                </Field>
            </div>
            <Field label="Case Court" id="case_court" error={errors?.case_court} valid={valid("case_court") as boolean}>
                <input id="case_court" name="case_court" type="text" value={form.case_court} onChange={onChange} className={getInputClass(valid("case_court") as boolean, errors?.case_court)} />
            </Field>
            <Field label="Case Status" id="case_status" error={errors?.case_status} valid={valid("case_status") as boolean}>
                <input id="case_status" name="case_status" type="text" value={form.case_status} onChange={onChange} className={getInputClass(valid("case_status") as boolean, errors?.case_status)} />
            </Field>
            <Field label="Cell Block" id="cell_block" error={errors?.cell_block} valid={valid("cell_block") as boolean}>
                <input id="cell_block" name="cell_block" type="text" value={form.cell_block} onChange={onChange} className={getInputClass(valid("cell_block") as boolean, errors?.cell_block)} />
            </Field>
            <Field label="Inmate Status" id="status" error={errors?.status} valid={valid("status") as boolean}>
                <Select value={form.status || ""} onValueChange={(val) => onFieldChange?.("status", val ?? "")}>
                    <SelectTrigger className={getInputClass(valid("status") as boolean, errors?.status)}>
                        <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Released">Released</SelectItem>
                        <SelectItem value="Transferred">Transferred</SelectItem>
                    </SelectContent>
                </Select>
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
                <input id="return_rate" name="return_rate" type="text" value={form.return_rate} onChange={onChange} className={getInputClass(valid("return_rate") as boolean, errors?.return_rate)} />
            </Field>
            <DateTimePickerField
                label="Date & Time Received"
                id="date_time_received"
                value={form.date_time_received}
                onChange={(nextValue) => onFieldChange?.("date_time_received", nextValue)}
            />
            <Field label="Turned Over By" id="turned_over_by" error={errors?.turned_over_by} valid={valid("turned_over_by") as boolean}>
                <input id="turned_over_by" name="turned_over_by" type="text" value={form.turned_over_by} onChange={onChange} className={getInputClass(valid("turned_over_by") as boolean, errors?.turned_over_by)} />
            </Field>
            <Field label="Receiving Duty Officer" id="receiving_duty_officer" error={errors?.receiving_duty_officer} valid={valid("receiving_duty_officer") as boolean}>
                <input id="receiving_duty_officer" name="receiving_duty_officer" type="text" value={form.receiving_duty_officer} onChange={onChange} className={getInputClass(valid("receiving_duty_officer") as boolean, errors?.receiving_duty_officer)} />
            </Field>
        </div>
    );
}

function StepProperty({ form, onChange, errors, onFileChange }: StepProps & { onFileChange?: (file: File) => void }) {
    const [preview, setPreview] = useState<string | null>(form.photo_path || null);

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files && e.target.files[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setPreview(url);
            onFileChange?.(file);
        }
    }

    const valid = (name: keyof typeof form) => form[name] && !errors?.[name];

    return (
        <div className="flex flex-col gap-6">
            <div className="flex justify-center">
                {preview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={preview} alt="Profile" className="h-48 w-48 object-cover rounded-lg border-4 border-white shadow-md" />
                ) : (
                    <div className="h-48 w-48 flex items-center justify-center bg-slate-100 rounded-lg text-slate-400 text-sm italic">No photo</div>
                )}
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2 flex flex-col gap-2">
                    <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Photo</label>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="block w-full text-sm text-slate-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100 cursor-pointer"
                    />
                </div>
                <div className="sm:col-span-2">
                    <Field label="Prisoner Property" id="prisoner_property" error={errors?.prisoner_property} valid={valid("prisoner_property") as boolean}>
                        <textarea id="prisoner_property" name="prisoner_property" rows={3} value={form.prisoner_property} onChange={onChange} className={getTextareaClass(valid("prisoner_property") as boolean, errors?.prisoner_property)} />
                    </Field>
                </div>
                <Field label="Property Receipt Number" id="property_receipt_number" error={errors?.property_receipt_number} valid={valid("property_receipt_number") as boolean}>
                    <input id="property_receipt_number" name="property_receipt_number" type="text" value={form.property_receipt_number} onChange={onChange} className={getInputClass(valid("property_receipt_number") as boolean, errors?.property_receipt_number)} />
                </Field>
            </div>
        </div>
    );
}

const STEP_COMPONENTS = [
    StepPersonal,
    StepPhysical,
    StepContact,
    StepEducation,
    StepCase,
    StepProperty,
];

// ─── Validation & Formatting ────────────────────────────────────────────────

type ValidationErrors = Partial<Record<keyof InmateForm, string>>;

function validateField(name: string, value: string): string {
    if (["first_name", "last_name", "birthdate", "gender", "contact_number", "educational_attainment", "course", "school_attended", "status", "admission_date"].includes(name)) {
        if (!value) return "This field is required.";
    }
    return "";
}

function validateForm(form: InmateForm): ValidationErrors {
    const errors: ValidationErrors = {};
    (Object.keys(form) as (keyof InmateForm)[]).forEach((key) => {
        const error = validateField(key, String(form[key] || ""));
        if (error) errors[key] = error;
    });
    return errors;
}

function formatValue(key: keyof InmateForm, value: string) {
    if (value === "") return null;
    if (["height_cm", "weight_kg", "no_of_children", "sentence_years"].includes(key)) {
        const num = Number(value);
        return isNaN(num) ? null : num;
    }
    if (key === "date_time_received") {
        if (!value) return null;
        const d = new Date(value);
        return isNaN(d.getTime()) ? null : d.toISOString();
    }
    return value;
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

interface EditInmateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: () => void;
    inmateId: string | null;
}

export default function EditInmateModal({ isOpen, onClose, onSubmit, inmateId }: EditInmateModalProps) {
    const [form, setForm] = useState<InmateForm>(INITIAL_FORM);
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 1 });
    const [errors, setErrors] = useState<ValidationErrors>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const fetchInmateData = useCallback(async () => {
        if (!inmateId) return;
        setIsLoading(true);
        try {
            const numericId = parseInt(inmateId.replace("INM-", ""), 10);
            const { data, error } = await supabase.from("inmates").select("*").eq("inmate_id", numericId).single();
            if (error) throw error;
            if (data) {
                const mapped: InmateForm = {
                    first_name: data.first_name || "",
                    last_name: data.last_name || "",
                    birthdate: data.birthdate || "",
                    gender: data.gender || "",
                    marital_status: data.marital_status || "",
                    place_of_birth: data.place_of_birth || "",
                    citizenship: data.citizenship || "",
                    nationality: data.nationality || "",
                    religion: data.religion || "",
                    race: data.race || "",
                    occupation: data.occupation || "",
                    no_of_children: String(data.no_of_children || ""),
                    height_cm: String(data.height_cm || ""),
                    weight_kg: String(data.weight_kg || ""),
                    hair_description: data.hair_description || "",
                    hair_color: data.hair_color || "",
                    complexion: data.complexion || "",
                    eyes_description: data.eyes_description || "",
                    eye_color: data.eye_color || "",
                    blood_type: data.blood_type || "",
                    identifying_marks: data.identifying_marks || "",
                    permanent_address: data.permanent_address || "",
                    provincial_address: data.provincial_address || "",
                    contact_number: data.contact_number || "",
                    emergency_contact_name: data.emergency_contact_name || "",
                    emergency_contact_number: data.emergency_contact_number || "",
                    father_name: data.father_name || "",
                    father_address: data.father_address || "",
                    mother_name: data.mother_name || "",
                    mother_address: data.mother_address || "",
                    wife_clw_name: data.wife_clw_name || "",
                    wife_clw_address: data.wife_clw_address || "",
                    relative_name: data.relative_name || "",
                    relative_address: data.relative_address || "",
                    educational_attainment: data.educational_attainment || "",
                    course: data.course || "",
                    school_attended: data.school_attended || "",
                    crime: data.crime || "",
                    offense_charged: data.offense_charged || "",
                    criminal_case_number: data.criminal_case_number || "",
                    sentence_years: String(data.sentence_years || ""),
                    court_details: data.court_details || "",
                    case_court: data.case_court || "",
                    case_status: data.case_status || "",
                    cell_block: data.cell_block || "",
                    admission_date: data.admission_date || "",
                    release_date: data.release_date || "",
                    status: data.status || "",
                    return_rate: data.return_rate || "",
                    date_time_received: data.date_time_received || "",
                    turned_over_by: data.turned_over_by || "",
                    receiving_duty_officer: data.receiving_duty_officer || "",
                    prisoner_property: data.prisoner_property || "",
                    property_receipt_number: data.property_receipt_number || "",
                    photo_path: data.photo_path || "",
                };
                setForm(mapped);
            }
        } catch (err) {
            console.error(err);
            toast.error("Failed to load roommate details.");
        } finally {
            setIsLoading(false);
        }
    }, [inmateId]);

    useEffect(() => {
        if (isOpen) {
            fetchInmateData();
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
            setForm(INITIAL_FORM);
            setPagination({ pageIndex: 0, pageSize: 1 });
            setErrors({});
            setPhotoFile(null);
        }
        return () => { document.body.style.overflow = "unset"; };
    }, [isOpen, fetchInmateData]);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
        setErrors(prev => ({ ...prev, [name]: validateField(name, value) }));
    }, []);

    const handleFieldChange = useCallback((name: keyof InmateForm, value: string) => {
        setForm(prev => ({ ...prev, [name]: value }));
        setErrors(prev => ({ ...prev, [name]: validateField(name, value) }));
    }, []);

    const handleSubmit = async () => {
        const validation = validateForm(form);
        setErrors(validation);
        if (Object.keys(validation).length > 0) {
            toast.error("Please fill out all required fields.");
            return;
        }

        setIsSubmitting(true);
        try {
            const numericId = parseInt(inmateId!.replace("INM-", ""), 10);
            let finalPhotoPath = form.photo_path;

            if (photoFile) {
                const formData = new FormData();
                formData.append("file", photoFile);

                const response = await fetch("/api/upload-inmate-photo", {
                    method: "POST",
                    body: formData,
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || "Upload failed");
                }

                const data = await response.json();
                finalPhotoPath = data.filePath;
            }

            const payload: Record<string, unknown> = {};
            Object.keys(form).forEach(key => {
                payload[key] = formatValue(key as keyof InmateForm, form[key as keyof InmateForm]);
            });
            payload.photo_path = finalPhotoPath;

            const { error } = await supabase.from("inmates").update(payload).eq("inmate_id", numericId);
            if (error) throw error;

            toast.success("Inmate updated successfully!");
            onSubmit();
            onClose();
        } catch (err: unknown) {
            console.error(err);
            toast.error(`Update failed: ${(err as Error).message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const currentStep = pagination.pageIndex;
    const { title: stepTitle, icon: StepIcon } = STEPS[currentStep];
    const StepComponent = STEP_COMPONENTS[currentStep];

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    onClick={onClose}
                >
                    <motion.div
                        className="relative flex w-full max-w-3xl min-w-[500px] h-[650px] flex-col rounded-2xl bg-white shadow-2xl overflow-hidden"
                        initial={{ opacity: 0, scale: 0.94, y: 24 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.94, y: 24 }} transition={{ type: "spring", duration: 0.38 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between border-b bg-teal-700 px-6 py-4 text-white">
                            <div className="flex items-center gap-3">
                                <div className="p-2 border border-white/20 rounded-full"><StepIcon size={18} /></div>
                                <div>
                                    <p className="font-lexend text-lg font-semibold">Edit Inmate Profile</p>
                                    <p className="text-xs text-teal-100">Step {currentStep + 1} of {STEPS.length} — {stepTitle}</p>
                                </div>
                            </div>
                            <button onClick={onClose} className="cursor-pointer p-1 hover:bg-white/20 rounded-full"><X size={22} /></button>
                        </div>

                        <div className="flex items-center justify-center gap-x-3 border-b bg-slate-50 px-6 py-3 overflow-x-auto custom-scrollbar">
                            {STEPS.map((s, idx) => (
                                <div key={s.title} className="flex items-center gap-x-3 flex-none">
                                    <button
                                        onClick={() => setPagination({ pageIndex: idx, pageSize: 1 })}
                                        className={`h-8 w-8 rounded-full text-xs font-bold flex items-center justify-center transition shrink-0 ${idx <= currentStep ? 'bg-teal-700 text-white' : 'bg-slate-200 text-slate-500'} cursor-pointer hover:ring-2 ring-teal-500/30`}
                                        title={s.title}
                                    >
                                        <s.icon size={15} />
                                    </button>
                                    {idx < STEPS.length - 1 && (
                                        <div className={`w-8 sm:w-12 h-0.5 rounded transition-colors ${idx < currentStep ? 'bg-teal-400' : 'bg-slate-200'}`} />
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="flex-1 overflow-y-auto px-6 py-5">
                            {isLoading ? (
                                <div className="h-full flex items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-600 border-t-transparent" /></div>
                            ) : (
                                <StepComponent form={form} onChange={handleChange} onFieldChange={handleFieldChange} errors={errors} onFileChange={setPhotoFile} />
                            )}
                        </div>

                        <div className="flex items-center justify-between border-t bg-slate-50 px-6 py-4">
                            <button
                                disabled={currentStep === 0}
                                onClick={() => setPagination(prev => ({ ...prev, pageIndex: prev.pageIndex - 1 }))}
                                className="px-4 py-2 border rounded-lg bg-white text-sm font-semibold hover:bg-slate-100 disabled:opacity-40"
                            >
                                Previous
                            </button>
                            {currentStep === STEPS.length - 1 ? (
                                <button onClick={handleSubmit} disabled={isSubmitting} className="px-6 py-2 bg-teal-700 text-white rounded-lg text-sm font-semibold hover:bg-teal-800 disabled:opacity-50 flex items-center gap-2">
                                    {isSubmitting ? "Updating..." : "Update Inmate"}
                                </button>
                            ) : (
                                <button onClick={() => setPagination(prev => ({ ...prev, pageIndex: prev.pageIndex + 1 }))} className="px-6 py-2 bg-teal-700 text-white rounded-lg text-sm font-semibold hover:bg-teal-800">
                                    Next
                                </button>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
