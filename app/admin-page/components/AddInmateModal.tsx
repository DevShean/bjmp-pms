"use client";

import { useState, useCallback, type ChangeEvent } from "react";
import type { PaginationState } from "@tanstack/react-table";
import { X, ChevronLeft, ChevronRight, Check, User, Activity, Phone, GraduationCap, Scale, Package } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type InmateGender = "Male" | "Female";
type InmateStatus = "Active" | "Released" | "Transferred";
type BloodType = "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-";

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
    height: string;
    weight: string;
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
    height: "", weight: "", height_cm: "", weight_kg: "", hair_description: "",
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

type FieldProps = {
    label: string;
    id: string;
    children: React.ReactNode;
};

function Field({ label, id, children }: FieldProps) {
    return (
        <div className="flex flex-col gap-1">
            <label htmlFor={id} className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                {label}
            </label>
            {children}
        </div>
    );
}

const inputClass =
    "w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none ring-teal-500 placeholder:text-slate-400 focus:ring-2 focus:border-teal-500 transition";

const textareaClass =
    "w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none ring-teal-500 placeholder:text-slate-400 focus:ring-2 focus:border-teal-500 transition resize-none";

const selectClass =
    "w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none ring-teal-500 focus:ring-2 focus:border-teal-500 transition";

// ─── Step Renderers ───────────────────────────────────────────────────────────

function StepPersonal({ form, onChange }: { form: InmateForm; onChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void }) {
    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="First Name" id="first_name">
                <input id="first_name" name="first_name" type="text" value={form.first_name} onChange={onChange} placeholder="Juan" className={inputClass} />
            </Field>
            <Field label="Last Name" id="last_name">
                <input id="last_name" name="last_name" type="text" value={form.last_name} onChange={onChange} placeholder="Dela Cruz" className={inputClass} />
            </Field>
            <Field label="Birthdate" id="birthdate">
                <input id="birthdate" name="birthdate" type="date" value={form.birthdate} onChange={onChange} className={inputClass} />
            </Field>
            <Field label="Gender" id="gender">
                <select id="gender" name="gender" value={form.gender} onChange={onChange} className={selectClass}>
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                </select>
            </Field>
            <Field label="Marital Status" id="marital_status">
                <input id="marital_status" name="marital_status" type="text" value={form.marital_status} onChange={onChange} placeholder="Single / Married…" className={inputClass} />
            </Field>
            <Field label="Place of Birth" id="place_of_birth">
                <input id="place_of_birth" name="place_of_birth" type="text" value={form.place_of_birth} onChange={onChange} placeholder="City, Province" className={inputClass} />
            </Field>
            <Field label="Citizenship" id="citizenship">
                <input id="citizenship" name="citizenship" type="text" value={form.citizenship} onChange={onChange} placeholder="Filipino" className={inputClass} />
            </Field>
            <Field label="Nationality" id="nationality">
                <input id="nationality" name="nationality" type="text" value={form.nationality} onChange={onChange} placeholder="Filipino" className={inputClass} />
            </Field>
            <Field label="Religion" id="religion">
                <input id="religion" name="religion" type="text" value={form.religion} onChange={onChange} placeholder="Catholic" className={inputClass} />
            </Field>
            <Field label="Race" id="race">
                <input id="race" name="race" type="text" value={form.race} onChange={onChange} placeholder="Asian" className={inputClass} />
            </Field>
            <Field label="Occupation" id="occupation">
                <input id="occupation" name="occupation" type="text" value={form.occupation} onChange={onChange} placeholder="Farmer, Driver…" className={inputClass} />
            </Field>
            <Field label="No. of Children" id="no_of_children">
                <input id="no_of_children" name="no_of_children" type="number" min="0" value={form.no_of_children} onChange={onChange} placeholder="0" className={inputClass} />
            </Field>
        </div>
    );
}

function StepPhysical({ form, onChange }: { form: InmateForm; onChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void }) {
    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Height (text)" id="height">
                <input id="height" name="height" type="text" value={form.height} onChange={onChange} placeholder='5&apos;8"' className={inputClass} />
            </Field>
            <Field label="Weight (text)" id="weight">
                <input id="weight" name="weight" type="text" value={form.weight} onChange={onChange} placeholder="65 kg" className={inputClass} />
            </Field>
            <Field label="Height (cm)" id="height_cm">
                <input id="height_cm" name="height_cm" type="number" step="0.01" value={form.height_cm} onChange={onChange} placeholder="172.50" className={inputClass} />
            </Field>
            <Field label="Weight (kg)" id="weight_kg">
                <input id="weight_kg" name="weight_kg" type="number" step="0.01" value={form.weight_kg} onChange={onChange} placeholder="65.00" className={inputClass} />
            </Field>
            <Field label="Hair Description" id="hair_description">
                <input id="hair_description" name="hair_description" type="text" value={form.hair_description} onChange={onChange} placeholder="Short, straight" className={inputClass} />
            </Field>
            <Field label="Hair Color" id="hair_color">
                <input id="hair_color" name="hair_color" type="text" value={form.hair_color} onChange={onChange} placeholder="Black" className={inputClass} />
            </Field>
            <Field label="Complexion" id="complexion">
                <input id="complexion" name="complexion" type="text" value={form.complexion} onChange={onChange} placeholder="Brown, fair…" className={inputClass} />
            </Field>
            <Field label="Eyes Description" id="eyes_description">
                <input id="eyes_description" name="eyes_description" type="text" value={form.eyes_description} onChange={onChange} placeholder="Almond-shaped" className={inputClass} />
            </Field>
            <Field label="Eye Color" id="eye_color">
                <input id="eye_color" name="eye_color" type="text" value={form.eye_color} onChange={onChange} placeholder="Brown" className={inputClass} />
            </Field>
            <Field label="Blood Type" id="blood_type">
                <select id="blood_type" name="blood_type" value={form.blood_type} onChange={onChange} className={selectClass}>
                    <option value="">Select blood type</option>
                    {(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as BloodType[]).map((bt) => (
                        <option key={bt} value={bt}>{bt}</option>
                    ))}
                </select>
            </Field>
            <div className="sm:col-span-2">
                <Field label="Identifying Marks" id="identifying_marks">
                    <textarea id="identifying_marks" name="identifying_marks" rows={3} value={form.identifying_marks} onChange={onChange} placeholder="Tattoos, scars, birthmarks…" className={textareaClass} />
                </Field>
            </div>
        </div>
    );
}

function StepContact({ form, onChange }: { form: InmateForm; onChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void }) {
    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Contact Number" id="contact_number">
                <input id="contact_number" name="contact_number" type="text" value={form.contact_number} onChange={onChange} placeholder="09XX-XXX-XXXX" className={inputClass} />
            </Field>
            <Field label="Emergency Contact Name" id="emergency_contact_name">
                <input id="emergency_contact_name" name="emergency_contact_name" type="text" value={form.emergency_contact_name} onChange={onChange} placeholder="Full name" className={inputClass} />
            </Field>
            <Field label="Emergency Contact Number" id="emergency_contact_number">
                <input id="emergency_contact_number" name="emergency_contact_number" type="text" value={form.emergency_contact_number} onChange={onChange} placeholder="09XX-XXX-XXXX" className={inputClass} />
            </Field>
            <div className="sm:col-span-2">
                <Field label="Permanent Address" id="permanent_address">
                    <textarea id="permanent_address" name="permanent_address" rows={2} value={form.permanent_address} onChange={onChange} placeholder="Street, Barangay, City, Province" className={textareaClass} />
                </Field>
            </div>
            <div className="sm:col-span-2">
                <Field label="Provincial Address" id="provincial_address">
                    <textarea id="provincial_address" name="provincial_address" rows={2} value={form.provincial_address} onChange={onChange} placeholder="Street, Barangay, City, Province" className={textareaClass} />
                </Field>
            </div>
            <Field label="Father's Name" id="father_name">
                <input id="father_name" name="father_name" type="text" value={form.father_name} onChange={onChange} placeholder="Full name" className={inputClass} />
            </Field>
            <div className="sm:col-span-2">
                <Field label="Father's Address" id="father_address">
                    <textarea id="father_address" name="father_address" rows={2} value={form.father_address} onChange={onChange} placeholder="Address" className={textareaClass} />
                </Field>
            </div>
            <Field label="Mother's Name" id="mother_name">
                <input id="mother_name" name="mother_name" type="text" value={form.mother_name} onChange={onChange} placeholder="Full name" className={inputClass} />
            </Field>
            <div className="sm:col-span-2">
                <Field label="Mother's Address" id="mother_address">
                    <textarea id="mother_address" name="mother_address" rows={2} value={form.mother_address} onChange={onChange} placeholder="Address" className={textareaClass} />
                </Field>
            </div>
            <Field label="Wife / CLW Name" id="wife_clw_name">
                <input id="wife_clw_name" name="wife_clw_name" type="text" value={form.wife_clw_name} onChange={onChange} placeholder="Full name (if applicable)" className={inputClass} />
            </Field>
            <div className="sm:col-span-2">
                <Field label="Wife / CLW Address" id="wife_clw_address">
                    <textarea id="wife_clw_address" name="wife_clw_address" rows={2} value={form.wife_clw_address} onChange={onChange} placeholder="Address" className={textareaClass} />
                </Field>
            </div>
            <Field label="Relative Name" id="relative_name">
                <input id="relative_name" name="relative_name" type="text" value={form.relative_name} onChange={onChange} placeholder="Full name" className={inputClass} />
            </Field>
            <div className="sm:col-span-2">
                <Field label="Relative's Address" id="relative_address">
                    <textarea id="relative_address" name="relative_address" rows={2} value={form.relative_address} onChange={onChange} placeholder="Address" className={textareaClass} />
                </Field>
            </div>
        </div>
    );
}

function StepEducation({ form, onChange }: { form: InmateForm; onChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void }) {
    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Educational Attainment" id="educational_attainment">
                <input id="educational_attainment" name="educational_attainment" type="text" value={form.educational_attainment} onChange={onChange} placeholder="College Graduate, High School…" className={inputClass} />
            </Field>
            <Field label="Course / Degree" id="course">
                <input id="course" name="course" type="text" value={form.course} onChange={onChange} placeholder="BS Criminology" className={inputClass} />
            </Field>
            <div className="sm:col-span-2">
                <Field label="School Attended" id="school_attended">
                    <input id="school_attended" name="school_attended" type="text" value={form.school_attended} onChange={onChange} placeholder="Name of school / university" className={inputClass} />
                </Field>
            </div>
        </div>
    );
}

function StepCase({ form, onChange }: { form: InmateForm; onChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void }) {
    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
                <Field label="Crime" id="crime">
                    <textarea id="crime" name="crime" rows={2} value={form.crime} onChange={onChange} placeholder="Describe the crime" className={textareaClass} />
                </Field>
            </div>
            <div className="sm:col-span-2">
                <Field label="Offense Charged" id="offense_charged">
                    <textarea id="offense_charged" name="offense_charged" rows={2} value={form.offense_charged} onChange={onChange} placeholder="Specific offense charged" className={textareaClass} />
                </Field>
            </div>
            <Field label="Criminal Case Number" id="criminal_case_number">
                <input id="criminal_case_number" name="criminal_case_number" type="text" value={form.criminal_case_number} onChange={onChange} placeholder="CC-2024-0001" className={inputClass} />
            </Field>
            <Field label="Sentence (Years)" id="sentence_years">
                <input id="sentence_years" name="sentence_years" type="number" min="0" value={form.sentence_years} onChange={onChange} placeholder="5" className={inputClass} />
            </Field>
            <div className="sm:col-span-2">
                <Field label="Court Details" id="court_details">
                    <textarea id="court_details" name="court_details" rows={2} value={form.court_details} onChange={onChange} placeholder="RTC Branch, City" className={textareaClass} />
                </Field>
            </div>
            <Field label="Case Court" id="case_court">
                <input id="case_court" name="case_court" type="text" value={form.case_court} onChange={onChange} placeholder="RTC Branch 1 – Manila" className={inputClass} />
            </Field>
            <Field label="Case Status" id="case_status">
                <input id="case_status" name="case_status" type="text" value={form.case_status} onChange={onChange} placeholder="Pending, Decided…" className={inputClass} />
            </Field>
            <Field label="Cell Block" id="cell_block">
                <input id="cell_block" name="cell_block" type="text" value={form.cell_block} onChange={onChange} placeholder="Block A" className={inputClass} />
            </Field>
            <Field label="Inmate Status" id="status">
                <select id="status" name="status" value={form.status} onChange={onChange} className={selectClass}>
                    <option value="">Select status</option>
                    <option value="Active">Active</option>
                    <option value="Released">Released</option>
                    <option value="Transferred">Transferred</option>
                </select>
            </Field>
            <Field label="Admission Date" id="admission_date">
                <input id="admission_date" name="admission_date" type="date" value={form.admission_date} onChange={onChange} className={inputClass} />
            </Field>
            <Field label="Release Date" id="release_date">
                <input id="release_date" name="release_date" type="date" value={form.release_date} onChange={onChange} className={inputClass} />
            </Field>
            <Field label="Return Rate" id="return_rate">
                <input id="return_rate" name="return_rate" type="text" value={form.return_rate} onChange={onChange} placeholder="Low / Medium / High" className={inputClass} />
            </Field>
            <Field label="Date & Time Received" id="date_time_received">
                <input id="date_time_received" name="date_time_received" type="datetime-local" value={form.date_time_received} onChange={onChange} className={inputClass} />
            </Field>
            <Field label="Turned Over By" id="turned_over_by">
                <input id="turned_over_by" name="turned_over_by" type="text" value={form.turned_over_by} onChange={onChange} placeholder="Officer name" className={inputClass} />
            </Field>
            <Field label="Receiving Duty Officer" id="receiving_duty_officer">
                <input id="receiving_duty_officer" name="receiving_duty_officer" type="text" value={form.receiving_duty_officer} onChange={onChange} placeholder="Officer name" className={inputClass} />
            </Field>
        </div>
    );
}

function StepProperty({ form, onChange }: { form: InmateForm; onChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void }) {
    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
                <Field label="Prisoner Property" id="prisoner_property">
                    <textarea id="prisoner_property" name="prisoner_property" rows={3} value={form.prisoner_property} onChange={onChange} placeholder="List of belongings confiscated…" className={textareaClass} />
                </Field>
            </div>
            <Field label="Property Receipt Number" id="property_receipt_number">
                <input id="property_receipt_number" name="property_receipt_number" type="text" value={form.property_receipt_number} onChange={onChange} placeholder="PR-2024-0001" className={inputClass} />
            </Field>
            <Field label="Photo Path / URL" id="photo_path">
                <input id="photo_path" name="photo_path" type="text" value={form.photo_path} onChange={onChange} placeholder="/photos/inmate-001.jpg" className={inputClass} />
            </Field>
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

// ─── Main Modal ───────────────────────────────────────────────────────────────

type AddInmateModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: InmateForm) => void;
};

export default function AddInmateModal({ isOpen, onClose, onSubmit }: AddInmateModalProps) {
    const [form, setForm] = useState<InmateForm>(INITIAL_FORM);
    const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 1 });

    const currentStep = pagination.pageIndex;
    const totalSteps = STEPS.length;
    const isFirstStep = currentStep === 0;
    const isLastStep = currentStep === totalSteps - 1;

    const handleChange = useCallback(
        (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
            const { name, value } = e.target;
            setForm((prev) => ({ ...prev, [name]: value }));
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
        onClose();
    }, [onClose]);

    const handleSubmit = useCallback(() => {
        onSubmit(form);
        handleClose();
    }, [form, handleClose, onSubmit]);

    if (!isOpen) return null;

    const StepComponent = STEP_COMPONENTS[currentStep];
    const { title: stepTitle, icon: StepIcon } = STEPS[currentStep];

    return (
        /* Overlay */
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: "rgba(0,0,0,0.55)" }}
            onClick={(e) => {
                if (e.target === e.currentTarget) handleClose();
            }}
            aria-modal="true"
            role="dialog"
            aria-labelledby="modal-title"
        >
            {/* Modal card – SweetAlert2-inspired */}
            <div className="relative flex w-full max-w-2xl flex-col rounded-2xl bg-white shadow-2xl overflow-hidden max-h-[90vh]">

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
                        className="rounded-full p-1.5 text-white/80 transition hover:bg-white/20 hover:text-white"
                        aria-label="Close modal"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* ── Step Indicator ─────────────────────────────────────── */}
                <div className="flex items-center gap-0 border-b border-slate-100 bg-slate-50 px-6 py-3">
                    {STEPS.map((step, idx) => {
                        const Icon = step.icon;
                        const isCompleted = idx < currentStep;
                        const isActive = idx === currentStep;
                        return (
                            <div key={step.title} className="flex flex-1 items-center">
                                <button
                                    type="button"
                                    title={step.title}
                                    onClick={() => setPagination((prev) => ({ ...prev, pageIndex: idx }))}
                                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition
                                        ${isCompleted ? "bg-teal-600 text-white" : isActive ? "bg-teal-700 text-white ring-2 ring-teal-300" : "bg-slate-200 text-slate-500 hover:bg-slate-300"}`}
                                >
                                    {isCompleted ? <Check size={13} /> : <Icon size={13} />}
                                </button>
                                {idx < STEPS.length - 1 && (
                                    <div
                                        className={`mx-1 h-0.5 flex-1 rounded transition ${isCompleted ? "bg-teal-500" : "bg-slate-200"}`}
                                    />
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* ── Body (scrollable) ──────────────────────────────────── */}
                <div className="flex-1 overflow-y-auto px-6 py-5">
                    <StepComponent form={form} onChange={handleChange} />
                </div>

                {/* ── Footer ─────────────────────────────────────────────── */}
                <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-4">
                    <button
                        type="button"
                        onClick={goPrev}
                        disabled={isFirstStep}
                        className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
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
                            className="flex items-center gap-1.5 rounded-lg bg-teal-700 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800"
                        >
                            <Check size={16} />
                            Submit
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={goNext}
                            className="flex items-center gap-1.5 rounded-lg bg-teal-700 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800"
                        >
                            Next
                            <ChevronRight size={16} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
