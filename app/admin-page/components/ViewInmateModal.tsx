import React, { useState, useEffect, useCallback } from "react";
import type { PaginationState } from "@tanstack/react-table";
import { format } from "date-fns";
import { X, ChevronLeft, ChevronRight, User, Activity, Phone, GraduationCap, Scale, Package } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";
import Image from "next/image";

import { getInmateImageUrl } from "@/app/lib/utils/image";
import { Dialog, DialogContent } from "@/components/ui/dialog";

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

// ─── View Field Sub-component ────────────────────────────────────────────────

type ViewFieldProps = {
    label: string;
    value: string | number | null | undefined;
    isFullWidth?: boolean;
};

function ViewField({ label, value, isFullWidth }: ViewFieldProps) {
    return (
        <div className={`flex flex-col gap-1 ${isFullWidth ? "sm:col-span-2" : ""}`}>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                {label}
            </span>
            <div className="min-h-[38px] w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm text-slate-800">
                {value || <span className="text-slate-400 italic">Not specified</span>}
            </div>
        </div>
    );
}

// ─── Step Renderers ───────────────────────────────────────────────────────────

function StepPersonal({ form }: { form: InmateForm }) {
    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <ViewField label="First Name" value={form.first_name} />
            <ViewField label="Last Name" value={form.last_name} />
            <ViewField label="Birthdate" value={form.birthdate ? format(new Date(form.birthdate), "PPP") : ""} />
            <ViewField label="Gender" value={form.gender} />
            <ViewField label="Marital Status" value={form.marital_status} />
            <ViewField label="Place of Birth" value={form.place_of_birth} />
            <ViewField label="Citizenship" value={form.citizenship} />
            <ViewField label="Nationality" value={form.nationality} />
            <ViewField label="Religion" value={form.religion} />
            <ViewField label="Race" value={form.race} />
            <ViewField label="Occupation" value={form.occupation} />
            <ViewField label="No. of Children" value={form.no_of_children} />
        </div>
    );
}

function StepPhysical({ form }: { form: InmateForm }) {
    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <ViewField label="Height (cm)" value={form.height_cm} />
            <ViewField label="Weight (kg)" value={form.weight_kg} />
            <ViewField label="Hair Description" value={form.hair_description} />
            <ViewField label="Hair Color" value={form.hair_color} />
            <ViewField label="Complexion" value={form.complexion} />
            <ViewField label="Eyes Description" value={form.eyes_description} />
            <ViewField label="Eye Color" value={form.eye_color} />
            <ViewField label="Blood Type" value={form.blood_type} />
            <ViewField label="Identifying Marks" value={form.identifying_marks} isFullWidth />
        </div>
    );
}

function StepContact({ form }: { form: InmateForm }) {
    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <ViewField label="Contact Number" value={form.contact_number} />
            <ViewField label="Emergency Contact Name" value={form.emergency_contact_name} />
            <ViewField label="Emergency Contact Number" value={form.emergency_contact_number} />
            <ViewField label="Permanent Address" value={form.permanent_address} isFullWidth />
            <ViewField label="Provincial Address" value={form.provincial_address} isFullWidth />
            <ViewField label="Father's Name" value={form.father_name} />
            <ViewField label="Father's Address" value={form.father_address} isFullWidth />
            <ViewField label="Mother's Name" value={form.mother_name} />
            <ViewField label="Mother's Address" value={form.mother_address} isFullWidth />
            <ViewField label="Wife / CLW Name" value={form.wife_clw_name} />
            <ViewField label="Wife / CLW Address" value={form.wife_clw_address} isFullWidth />
            <ViewField label="Relative Name" value={form.relative_name} />
            <ViewField label="Relative's Address" value={form.relative_address} isFullWidth />
        </div>
    );
}

function StepEducation({ form }: { form: InmateForm }) {
    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <ViewField label="Educational Attainment" value={form.educational_attainment} />
            <ViewField label="Course / Degree" value={form.course} />
            <ViewField label="School Attended" value={form.school_attended} isFullWidth />
        </div>
    );
}

function StepCase({ form }: { form: InmateForm }) {
    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <ViewField label="Crime" value={form.crime} isFullWidth />
            <ViewField label="Offense Charged" value={form.offense_charged} isFullWidth />
            <ViewField label="Criminal Case Number" value={form.criminal_case_number} />
            <ViewField label="Sentence (Years)" value={form.sentence_years} />
            <ViewField label="Court Details" value={form.court_details} isFullWidth />
            <ViewField label="Case Court" value={form.case_court} />
            <ViewField label="Case Status" value={form.case_status} />
            <ViewField label="Cell Block" value={form.cell_block} />
            <ViewField label="Inmate Status" value={form.status} />
            <ViewField label="Admission Date" value={form.admission_date ? format(new Date(form.admission_date), "PPP") : ""} />
            <ViewField label="Release Date" value={form.release_date ? format(new Date(form.release_date), "PPP") : ""} />
            <ViewField label="Return Rate" value={form.return_rate} />
            <ViewField label="Date & Time Received" value={form.date_time_received ? format(new Date(form.date_time_received), "PPP p") : ""} />
            <ViewField label="Turned Over By" value={form.turned_over_by} />
            <ViewField label="Receiving Duty Officer" value={form.receiving_duty_officer} />
        </div>
    );
}

function StepProperty({ form }: { form: InmateForm }) {
    const fullName = `${form.first_name} ${form.last_name}`;
    const finalImageUrl = getInmateImageUrl(form.photo_path, fullName);

    return (
        <div className="flex flex-col gap-6">
            <div className="flex justify-center">
                <div className="relative h-48 w-48 overflow-hidden rounded-lg shadow-md border-4 border-white bg-slate-100">
                    <Image
                        src={finalImageUrl}
                        alt={`${fullName} Profile photo`}
                        fill
                        className="object-cover"
                        unoptimized={finalImageUrl.startsWith("data:")}
                    />
                </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <ViewField label="Prisoner Property" value={form.prisoner_property} isFullWidth />
                <ViewField label="Property Receipt Number" value={form.property_receipt_number} />
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

// ─── Main Modal ───────────────────────────────────────────────────────────────

interface ViewInmateModalProps {
    isOpen: boolean;
    onClose: () => void;
    inmateId: string | null; // e.g., "INM-001"
}

export default function ViewInmateModal({ isOpen, onClose, inmateId }: ViewInmateModalProps) {
    const [form, setForm] = useState<InmateForm>(INITIAL_FORM);
    const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 1 });
    const [isLoading, setIsLoading] = useState(false);

    const fetchInmateData = useCallback(async () => {
        if (!inmateId) return;

        setIsLoading(true);
        try {
            // Extract numeric ID from "INM-001"
            const numericId = parseInt(inmateId.replace("INM-", ""), 10);
            
            const { data, error } = await supabase
                .from("inmates")
                .select("*")
                .eq("inmate_id", numericId)
                .single();

            if (error) throw error;

            if (data) {
                // Map DB columns to form state (handling nulls)
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
            console.error("Error fetching inmate:", err);
            toast.error("Failed to load inmate details.");
        } finally {
            setIsLoading(false);
        }
    }, [inmateId]);

    useEffect(() => {
        if (isOpen) {
            fetchInmateData();
        } else {
            setPagination({ pageIndex: 0, pageSize: 1 });
        }
    }, [isOpen, fetchInmateData]);

    const currentStep = pagination.pageIndex;
    const totalSteps = STEPS.length;
    const isFirstStep = currentStep === 0;
    const isLastStep = currentStep === totalSteps - 1;

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

    const StepComponent = STEP_COMPONENTS[currentStep];
    const { title: stepTitle, icon: StepIcon } = STEPS[currentStep];

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent 
                className="flex w-full max-w-3xl min-w-[500px] h-[650px] max-h-[90vh] flex-col rounded-2xl bg-white shadow-2xl overflow-hidden border-none p-0"
                showCloseButton={false}
            >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-200 bg-teal-800 px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
                            <StepIcon size={18} className="text-white" />
                        </div>
                        <div>
                            <p className="font-lexend text-lg font-semibold text-white leading-tight">
                                View Inmate Profile
                            </p>
                            <p className="text-xs text-teal-100/80">
                                Step {currentStep + 1} of {totalSteps} — {stepTitle}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-full p-1.5 text-white/80 hover:bg-white/20 hover:text-white transition cursor-pointer"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Step Indicator */}
                <div className="flex items-center justify-center gap-x-3 border-b border-slate-100 bg-slate-50 px-6 py-3 overflow-x-auto custom-scrollbar scrollbar-hide">
                    {STEPS.map((step, idx) => {
                        const Icon = step.icon;
                        const isVisited = idx <= currentStep;
                        const isActive = idx === currentStep;
                        return (
                            <div key={step.title} className="flex items-center gap-x-3 flex-none">
                                <button
                                    title={step.title}
                                    onClick={() => setPagination((prev) => ({ ...prev, pageIndex: idx }))}
                                    className={`cursor-pointer flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition
                                        ${isActive ? "bg-teal-800 text-white ring-2 ring-teal-200" : isVisited ? "bg-teal-600 text-white" : "bg-slate-200 text-slate-500 hover:bg-slate-300"}`}
                                >
                                    <Icon size={15} />
                                </button>
                                {idx < STEPS.length - 1 && (
                                    <div className={`w-8 sm:w-12 h-0.5 rounded transition-colors ${isVisited && idx < currentStep ? "bg-teal-500" : "bg-slate-200"}`} />
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-6 py-5 bg-white scrollbar-hide">
                    {isLoading ? (
                        <div className="flex h-full items-center justify-center">
                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-600 border-t-transparent" />
                        </div>
                    ) : (
                        <StepComponent form={form} />
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-4 rounded-b-2xl">
                    <button
                        onClick={goPrev}
                        disabled={isFirstStep}
                        className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-100 disabled:opacity-40 transition cursor-pointer disabled:cursor-not-allowed"
                    >
                        <ChevronLeft size={16} />
                        Previous
                    </button>

                    <div className="flex items-center gap-3">
                        {isLastStep ? (
                            <button
                                onClick={onClose}
                                className="rounded-lg bg-teal-800 px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-teal-900 transition cursor-pointer"
                            >
                                Done
                            </button>
                        ) : (
                            <button
                                onClick={goNext}
                                className="flex items-center gap-1.5 rounded-lg bg-teal-800 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-teal-900 transition cursor-pointer"
                            >
                                Next
                                <ChevronRight size={16} />
                            </button>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
