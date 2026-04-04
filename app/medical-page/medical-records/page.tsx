"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";
import {
  AlertCircle,
  AlertTriangle,
  Building2,
  CalendarDays,
  CalendarIcon,
  Check,
  CheckCircle2,
  ChevronDown,
  Edit2,
  FilterX,
  HeartPulse,
  Loader2,
  Pill,
  Search,
  BookHeart,
  X,
} from "lucide-react";
import MedicalSidebarLayout from "../components/MedicalSidebarLayout";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

// ─── Types ────────────────────────────────────────────────────────────────────

type MedicalVisitType =
  | "Routine Checkup"
  | "Emergency"
  | "Follow-up"
  | "Mental Health"
  | "Other";

type MedicalRecord = {
  recordId: number;
  inmateId: number;
  inmateName: string;
  visitType: MedicalVisitType;
  diagnosis: string;
  treatment: string;
  medication: string;
  bloodPressure: string;
  temperatureC: number | null;
  pulseRate: number | null;
  respiratoryRate: number | null;
  medicalCondition: string;
  allergies: string;
  nextCheckupDate: string;
  hospitalReferred: string;
  recordDate: string;
};

type EditFormState = {
  visitType: MedicalVisitType;
  diagnosis: string;
  treatment: string;
  medication: string;
  bloodPressure: string;
  temperatureC: string;
  pulseRate: string;
  respiratoryRate: string;
  medicalCondition: string;
  allergies: string;
  nextCheckupDate: string;
  hospitalReferred: string;
  recordDate: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getSession(): { userId: number; email: string; role: string } | null {
  try {
    const cookie = document.cookie
      .split("; ")
      .find((row) => row.startsWith("bjmp_session="));
    if (!cookie) return null;
    const raw = decodeURIComponent(cookie.split("=")[1]);
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

const VISIT_TYPE_OPTIONS: MedicalVisitType[] = [
  "Routine Checkup",
  "Emergency",
  "Follow-up",
  "Mental Health",
  "Other",
];

const PAGE_SIZE = 6;

const visitTypeBadgeStyles: Record<MedicalVisitType, string> = {
  "Routine Checkup": "bg-blue-100 text-blue-700",
  "Emergency": "bg-rose-100 text-rose-700",
  "Follow-up": "bg-amber-100 text-amber-700",
  "Mental Health": "bg-purple-100 text-purple-700",
  "Other": "bg-slate-100 text-slate-600",
};

// ─── Date Picker Field ────────────────────────────────────────────────────────

function DatePickerField({
  value,
  onChange,
  valid,
}: {
  value: string;
  onChange: (val: string) => void;
  valid?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const selected = value ? new Date(value + "T00:00:00") : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className={`field-input inline-flex items-center justify-between gap-2 cursor-pointer${valid ? " field-input-valid" : ""}`}>
        <span className={selected ? "text-slate-800" : "text-slate-400"}>
          {selected
            ? selected.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
            : "Pick a date"}
        </span>
        <CalendarIcon className="h-4 w-4 shrink-0 text-slate-400" />
      </PopoverTrigger>
      <PopoverContent align="start" sideOffset={6} className="w-auto p-0">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(date) => {
            if (date) {
              const y = date.getFullYear();
              const m = String(date.getMonth() + 1).padStart(2, "0");
              const d = String(date.getDate()).padStart(2, "0");
              onChange(`${y}-${m}-${d}`);
            } else {
              onChange("");
            }
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

// ─── Visit Type Combobox ──────────────────────────────────────────────────────

function VisitTypeCombobox({
  value,
  onChange,
  badge = false,
  valid,
}: {
  value: MedicalVisitType;
  onChange: (val: MedicalVisitType) => void;
  badge?: boolean;
  valid?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className={
          badge
            ? `inline-flex cursor-pointer shrink-0 whitespace-nowrap items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider shadow-none transition focus:outline-none focus:ring-1 ${visitTypeBadgeStyles[value]}`
            : `field-input inline-flex items-center justify-between gap-2 cursor-pointer${valid ? " field-input-valid" : ""}`
        }
      >
        <span>{value}</span>
        {!badge && <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />}
      </PopoverTrigger>
      <PopoverContent align="start" sideOffset={6} className="w-48 p-1">
        {VISIT_TYPE_OPTIONS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => { onChange(t); setOpen(false); }}
            className="flex w-full cursor-pointer items-center gap-2 rounded-md px-3 py-1.5 text-sm text-slate-700 transition hover:bg-slate-100"
          >
            <span className="flex-1 text-left">{t}</span>
            {value === t && <Check className="h-3.5 w-3.5 text-slate-600" />}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}

// ─── Medical Record Card ──────────────────────────────────────────────────────

function MedicalRecordCard({
  record,
  onEdit,
  onVisitTypeChange,
}: {
  record: MedicalRecord;
  onEdit: (record: MedicalRecord) => void;
  onVisitTypeChange: (record: MedicalRecord, newType: MedicalVisitType) => void;
}) {
  return (
    <div className="flex flex-col rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      {/* Card Header */}
      <div className="flex items-start justify-between border-b border-slate-100 px-5 pt-5 pb-4">
        <div>
          <h3 className="font-lexend text-base font-bold text-slate-800">
            {record.inmateName}
          </h3>
          <p className="mt-0.5 text-xs text-slate-400">
            Record Date:{" "}
            {new Date(record.recordDate).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>
        <VisitTypeCombobox
          value={record.visitType}
          onChange={(val) => onVisitTypeChange(record, val)}
          badge
        />
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-3 px-5 py-4">
        {/* Diagnosis / Treatment / Medication */}
        <div className="space-y-1.5">
          <p className="flex items-center gap-2 text-sm text-slate-700">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
            <span className="font-semibold text-slate-600">Diagnosis:</span>{" "}
            <span className="text-slate-500">{record.diagnosis || ""}</span>
          </p>
          <p className="flex items-center gap-2 text-sm text-slate-700">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
            <span className="font-semibold text-slate-600">Treatment:</span>{" "}
            <span className="text-slate-500">{record.treatment || ""}</span>
          </p>
          <p className="flex items-center gap-2 text-sm text-slate-700">
            <Pill className="h-4 w-4 shrink-0 text-violet-500" />
            <span className="font-semibold text-slate-600">Medication:</span>{" "}
            <span className="text-slate-500">{record.medication || ""}</span>
          </p>
        </div>

        <hr className="border-slate-100" />

        {/* Vital Signs */}
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
            <HeartPulse className="h-3.5 w-3.5 text-blue-500" />
            Vital Signs
          </p>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg bg-blue-50 px-3 py-2 text-xs">
              <span className="font-semibold text-blue-700">BP: </span>
              <span className="text-blue-600">{record.bloodPressure || ""}</span>
            </div>
            <div className="rounded-lg bg-red-50 px-3 py-2 text-xs">
              <span className="font-semibold text-red-700">Temp: </span>
              <span className="text-red-500">
                {record.temperatureC != null ? `${record.temperatureC}°C` : ""}
              </span>
            </div>
            <div className="rounded-lg bg-emerald-50 px-3 py-2 text-xs">
              <span className="font-semibold text-emerald-700">Pulse: </span>
              <span className="text-emerald-600">
                {record.pulseRate != null ? `${record.pulseRate} bpm` : ""}
              </span>
            </div>
            <div className="rounded-lg bg-violet-50 px-3 py-2 text-xs">
              <span className="font-semibold text-violet-700">Resp Rate: </span>
              <span className="text-violet-600">
                {record.respiratoryRate != null ? `${record.respiratoryRate} bpm` : ""}
              </span>
            </div>
          </div>
        </div>

        <hr className="border-slate-100" />

        {/* Condition / Allergies / Next Checkup / Referred To */}
        <div className="space-y-1.5">
          <p className="flex items-center gap-2 text-sm">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
            <span className="font-semibold text-slate-600">Condition:</span>{" "}
            <span className="text-slate-500">{record.medicalCondition || ""}</span>
          </p>
          <p className="flex items-center gap-2 text-sm">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
            <span className="font-semibold text-slate-600">Allergies:</span>{" "}
            <span className="text-slate-500">{record.allergies || ""}</span>
          </p>
          <p className="flex items-center gap-2 text-sm">
            <CalendarDays className="h-4 w-4 shrink-0 text-blue-500" />
            <span className="font-semibold text-slate-600">Next Checkup:</span>{" "}
            <span className="text-slate-500">{record.nextCheckupDate || ""}</span>
          </p>
          <p className="flex items-center gap-2 text-sm">
            <Building2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span className="font-semibold text-slate-600">Referred To:</span>{" "}
            <span className="text-slate-500">{record.hospitalReferred || ""}</span>
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-end border-t border-slate-100 px-5 py-3">
        <button
          type="button"
          onClick={() => onEdit(record)}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-[#2563eb] px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#1d4ed8]"
        >
          <Edit2 className="h-3.5 w-3.5" />
          Edit
        </button>
      </div>
    </div>
  );
}

// ─── Edit Modal ───────────────────────────────────────────────────────────────

function EditMedicalRecordModal({
  record,
  isOpen,
  onClose,
  onSaved,
}: {
  record: MedicalRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: (updated: MedicalRecord) => void;
}) {
  const [form, setForm] = useState<EditFormState>({
    visitType: "Routine Checkup",
    diagnosis: "",
    treatment: "",
    medication: "",
    bloodPressure: "",
    temperatureC: "",
    pulseRate: "",
    respiratoryRate: "",
    medicalCondition: "",
    allergies: "",
    nextCheckupDate: "",
    hospitalReferred: "",
    recordDate: "",
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (record) {
      setForm({
        visitType: record.visitType,
        diagnosis: record.diagnosis || "",
        treatment: record.treatment || "",
        medication: record.medication || "",
        bloodPressure: record.bloodPressure || "",
        temperatureC: record.temperatureC != null ? String(record.temperatureC) : "",
        pulseRate: record.pulseRate != null ? String(record.pulseRate) : "",
        respiratoryRate: record.respiratoryRate != null ? String(record.respiratoryRate) : "",
        medicalCondition: record.medicalCondition || "",
        allergies: record.allergies || "",
        nextCheckupDate: record.nextCheckupDate || "",
        hospitalReferred: record.hospitalReferred || "",
        recordDate: record.recordDate || "",
      });
    }
  }, [record]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!record) return;

    // ── Validation ──────────────────────────────────────────────
    if (!form.recordDate) {
      toast.error("Record Date is required.");
      return;
    }
    if (form.bloodPressure && !/^\d{2,3}\/\d{2,3}$/.test(form.bloodPressure.trim())) {
      toast.error("Blood Pressure must be in the format 120/80.");
      return;
    }
    if (form.temperatureC) {
      const temp = parseFloat(form.temperatureC);
      if (isNaN(temp) || temp < 30 || temp > 45) {
        toast.error("Temperature must be between 30°C and 45°C.");
        return;
      }
    }
    if (form.pulseRate) {
      const pulse = parseInt(form.pulseRate);
      if (isNaN(pulse) || pulse < 20 || pulse > 300) {
        toast.error("Pulse Rate must be between 20 and 300 bpm.");
        return;
      }
    }
    if (form.respiratoryRate) {
      const rr = parseInt(form.respiratoryRate);
      if (isNaN(rr) || rr < 5 || rr > 60) {
        toast.error("Respiratory Rate must be between 5 and 60 bpm.");
        return;
      }
    }
    if (form.nextCheckupDate && form.nextCheckupDate <= form.recordDate) {
      toast.error("Next Checkup Date must be after the Record Date.");
      return;
    }
    // ────────────────────────────────────────────────────────────

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("medical_records")
        .update({
          visit_type: form.visitType,
          diagnosis: form.diagnosis || null,
          treatment: form.treatment || null,
          medication: form.medication || null,
          blood_pressure: form.bloodPressure || null,
          temperature_c: form.temperatureC ? parseFloat(form.temperatureC) : null,
          pulse_rate: form.pulseRate ? parseInt(form.pulseRate) : null,
          respiratory_rate: form.respiratoryRate ? parseInt(form.respiratoryRate) : null,
          medical_condition: form.medicalCondition || null,
          allergies: form.allergies || null,
          next_checkup_date: form.nextCheckupDate || null,
          hospital_referred: form.hospitalReferred || null,
          record_date: form.recordDate || null,
        })
        .eq("record_id", record.recordId);

      if (error) throw error;

      const updated: MedicalRecord = {
        ...record,
        visitType: form.visitType,
        diagnosis: form.diagnosis,
        treatment: form.treatment,
        medication: form.medication,
        bloodPressure: form.bloodPressure,
        temperatureC: form.temperatureC ? parseFloat(form.temperatureC) : null,
        pulseRate: form.pulseRate ? parseInt(form.pulseRate) : null,
        respiratoryRate: form.respiratoryRate ? parseInt(form.respiratoryRate) : null,
        medicalCondition: form.medicalCondition,
        allergies: form.allergies,
        nextCheckupDate: form.nextCheckupDate,
        hospitalReferred: form.hospitalReferred,
        recordDate: form.recordDate || record.recordDate,
      };

      toast.success("Medical record updated successfully.");
      onSaved(updated);
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update record.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="flex w-full max-w-5xl min-w-200 max-h-[90vh] flex-col rounded-2xl bg-white shadow-2xl overflow-hidden border-none p-0"
        showCloseButton={false}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b bg-blue-700 px-6 py-4 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
              <HeartPulse size={20} className="text-white" />
            </div>
            <div>
              <h2 className="font-lexend text-lg font-semibold leading-tight">Edit Medical Record</h2>
              <p className="text-xs text-blue-100 mt-0.5 uppercase tracking-wider font-medium">
                {record?.inmateName}
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
        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5 space-y-4">
          {/* Visit Type | Record Date | Medical Condition | Allergies */}
          <div className="grid grid-cols-4 gap-4">
            <Field label="Visit Type">
              <VisitTypeCombobox
                value={form.visitType}
                onChange={(val) => setForm((prev) => ({ ...prev, visitType: val }))}
                valid={!!form.visitType}
              />
            </Field>
            <Field label="Record Date">
              <DatePickerField
                value={form.recordDate}
                onChange={(val) => setForm((prev) => ({ ...prev, recordDate: val }))}
                valid={!!form.recordDate}
              />
            </Field>
            <Field label="Medical Condition" valid={!!form.medicalCondition}>
              <input name="medicalCondition" type="text" value={form.medicalCondition} onChange={handleChange} placeholder="Enter condition" className={`field-input !pr-9${form.medicalCondition ? " field-input-valid" : ""}`} />
            </Field>
            <Field label="Allergies" valid={!!form.allergies}>
              <input name="allergies" type="text" value={form.allergies} onChange={handleChange} placeholder="Enter allergies" className={`field-input !pr-9${form.allergies ? " field-input-valid" : ""}`} />
            </Field>
          </div>

          {/* Diagnosis / Treatment / Medication */}
          <div className="grid grid-cols-3 gap-4">
            <Field label="Diagnosis" valid={!!form.diagnosis}>
              <input name="diagnosis" type="text" value={form.diagnosis} onChange={handleChange} placeholder="Enter diagnosis" className={`field-input !pr-9${form.diagnosis ? " field-input-valid" : ""}`} />
            </Field>
            <Field label="Treatment" valid={!!form.treatment}>
              <input name="treatment" type="text" value={form.treatment} onChange={handleChange} placeholder="Enter treatment" className={`field-input !pr-9${form.treatment ? " field-input-valid" : ""}`} />
            </Field>
            <Field label="Medication" valid={!!form.medication}>
              <input name="medication" type="text" value={form.medication} onChange={handleChange} placeholder="Enter medication" className={`field-input !pr-9${form.medication ? " field-input-valid" : ""}`} />
            </Field>
          </div>

          {/* Vital Signs — 4 columns */}
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">Vital Signs</p>
            <div className="grid grid-cols-4 gap-4">
              <Field label="Blood Pressure" valid={!!form.bloodPressure}>
                <input name="bloodPressure" type="text" value={form.bloodPressure} onChange={handleChange} placeholder="e.g. 120/80" className={`field-input !pr-9${form.bloodPressure ? " field-input-valid" : ""}`} />
              </Field>
              <Field label="Temperature (°C)" valid={!!form.temperatureC}>
                <input name="temperatureC" type="number" step="0.1" value={form.temperatureC} onChange={handleChange} placeholder="e.g. 36.5" className={`field-input !pr-9${form.temperatureC ? " field-input-valid" : ""}`} />
              </Field>
              <Field label="Pulse Rate (bpm)" valid={!!form.pulseRate}>
                <input name="pulseRate" type="number" value={form.pulseRate} onChange={handleChange} placeholder="e.g. 72" className={`field-input !pr-9${form.pulseRate ? " field-input-valid" : ""}`} />
              </Field>
              <Field label="Respiratory Rate (bpm)" valid={!!form.respiratoryRate}>
                <input name="respiratoryRate" type="number" value={form.respiratoryRate} onChange={handleChange} placeholder="e.g. 16" className={`field-input !pr-9${form.respiratoryRate ? " field-input-valid" : ""}`} />
              </Field>
            </div>
          </div>

          {/* Next Checkup / Referred To */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Next Checkup Date">
              <DatePickerField
                value={form.nextCheckupDate}
                onChange={(val) => setForm((prev) => ({ ...prev, nextCheckupDate: val }))}
                valid={!!form.nextCheckupDate}
              />
            </Field>
            <Field label="Referred To" valid={!!form.hospitalReferred}>
              <input name="hospitalReferred" type="text" value={form.hospitalReferred} onChange={handleChange} placeholder="Hospital or specialist" className={`field-input !pr-9${form.hospitalReferred ? " field-input-valid" : ""}`} />
            </Field>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t bg-slate-50 px-6 py-4 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="cursor-pointer rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-blue-700 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 disabled:opacity-70"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Edit2 className="h-4 w-4" />}
            {isSaving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Field wrapper ────────────────────────────────────────────────────────────

function Field({ label, children, valid }: { label: string; children: React.ReactNode; valid?: boolean }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="font-lexend text-xs font-semibold text-slate-600 uppercase tracking-wide">
        {label}
      </label>
      <div className="relative">
        {children}
        {valid && (
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-green-500 pointer-events-none">
            <Check size={18} strokeWidth={2.5} />
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type SupabaseRow = {
  record_id: number;
  inmate_id: number;
  visit_type: string;
  diagnosis: string | null;
  treatment: string | null;
  medication: string | null;
  blood_pressure: string | null;
  temperature_c: number | null;
  pulse_rate: number | null;
  respiratory_rate: number | null;
  medical_condition: string | null;
  allergies: string | null;
  next_checkup_date: string | null;
  hospital_referred: string | null;
  record_date: string;
  inmates: { first_name: string | null; last_name: string | null } | null;
};

export default function MedicalRecordsPage() {
  const router = useRouter();
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editRecord, setEditRecord] = useState<MedicalRecord | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [staffId, setStaffId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<MedicalVisitType | "All">("All");
  const [filterOpen, setFilterOpen] = useState(false);

  // Validate session on mount — redirect to /admin if missing or not medical staff
  useEffect(() => {
    const session = getSession();
    if (!session) {
      router.replace("/admin");
      return;
    }
    if (session.role !== "Medical Staff") {
      router.replace("/admin");
      return;
    }
    setStaffId(session.userId);
  }, [router]);

  const fetchRecords = useCallback(async (id: number) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("medical_records")
        .select(
          `record_id, inmate_id, visit_type, diagnosis, treatment, medication,
           blood_pressure, temperature_c, pulse_rate, respiratory_rate,
           medical_condition, allergies, next_checkup_date, hospital_referred, record_date,
           inmates(first_name, last_name)`
        )
        .eq("staff_id", id)
        .order("record_date", { ascending: false });

      if (error) throw error;

      const rows = (data ?? []) as unknown as SupabaseRow[];
      setRecords(
        rows.map((r) => ({
          recordId: r.record_id,
          inmateId: r.inmate_id,
          inmateName: r.inmates
            ? `${r.inmates.first_name ?? ""} ${r.inmates.last_name ?? ""}`.trim()
            : "Unknown PDL",
          visitType: (r.visit_type as MedicalVisitType) || "Other",
          diagnosis: r.diagnosis ?? "",
          treatment: r.treatment ?? "",
          medication: r.medication ?? "",
          bloodPressure: r.blood_pressure ?? "",
          temperatureC: r.temperature_c,
          pulseRate: r.pulse_rate,
          respiratoryRate: r.respiratory_rate,
          medicalCondition: r.medical_condition ?? "",
          allergies: r.allergies ?? "",
          nextCheckupDate: r.next_checkup_date ?? "",
          hospitalReferred: r.hospital_referred ?? "",
          recordDate: r.record_date,
        }))
      );
      setCurrentPage(1);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load medical records.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (staffId !== null) {
      fetchRecords(staffId);
    }
  }, [staffId, fetchRecords]);

  const handleEdit = (record: MedicalRecord) => {
    setEditRecord(record);
    setIsEditOpen(true);
  };

  const filteredRecords = records.filter((r) => {
    const matchesSearch = r.inmateName.toLowerCase().includes(search.toLowerCase());
    const matchesType = filterType === "All" || r.visitType === filterType;
    return matchesSearch && matchesType;
  });

  const totalPages = Math.ceil(filteredRecords.length / PAGE_SIZE);
  const pagedRecords = filteredRecords.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const handleSearch = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const handleFilterType = (value: MedicalVisitType | "All") => {
    setFilterType(value);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearch("");
    setFilterType("All");
    setCurrentPage(1);
  };

  const hasActiveFilters = search !== "" || filterType !== "All";

  const handleVisitTypeChange = async (
    record: MedicalRecord,
    newType: MedicalVisitType
  ) => {
    // Optimistic update
    setRecords((prev) =>
      prev.map((r) =>
        r.recordId === record.recordId ? { ...r, visitType: newType } : r
      )
    );
    try {
      const { error } = await supabase
        .from("medical_records")
        .update({ visit_type: newType })
        .eq("record_id", record.recordId);
      if (error) throw error;
      toast.success("Visit type updated.");
    } catch (err) {
      // Revert on failure
      setRecords((prev) =>
        prev.map((r) =>
          r.recordId === record.recordId ? { ...r, visitType: record.visitType } : r
        )
      );
      toast.error(err instanceof Error ? err.message : "Failed to update visit type.");
    }
  };

  return (
    <MedicalSidebarLayout>
      <style>{`.field-input{width:100%;border-radius:0.5rem;border:1px solid #cbd5e1;background:#f8fafc;padding:0.5rem 0.75rem;font-size:0.875rem;color:#1e293b;outline:none;transition:border-color 0.15s,box-shadow 0.15s;}.field-input:focus{border-color:#2563eb;box-shadow:0 0 0 2px rgba(37,99,235,0.2);}.field-input::placeholder{color:#94a3b8;}.field-input-valid{border-color:#22c55e;}`}</style>

      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="font-lexend text-3xl font-semibold text-slate-800 flex items-center gap-3">
            Assigned Inmate Medical Records
            <BookHeart className="text-blue-700" size={32} />
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Showing records assigned to you. Click <strong>Edit</strong> to update any record.
          </p>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-24 text-slate-400">
            <Loader2 className="mr-2 h-6 w-6 animate-spin" />
            <span className="text-sm">Loading medical records…</span>
          </div>
        ) : records.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white py-24 text-center">
            <HeartPulse className="mb-3 h-10 w-10 text-slate-300" />
            <p className="font-lexend text-base font-semibold text-slate-600">
              No records assigned
            </p>
            <p className="mt-1 text-sm text-slate-400">
              Medical records assigned to you will appear here.
            </p>
          </div>
        ) : (
          <>
            {/* Search & Filter Bar */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1 max-w-sm">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Search by inmate name…"
                  className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
                />
              </div>
              <div className="flex items-center gap-2">
                <Popover open={filterOpen} onOpenChange={setFilterOpen}>
                  <PopoverTrigger
                    className="inline-flex cursor-pointer items-center justify-between gap-2 w-44 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-none transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300"
                  >
                    <span className="truncate">{filterType === "All" ? "All Visit Types" : filterType}</span>
                    <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${filterOpen ? "rotate-180" : ""}`} />
                  </PopoverTrigger>
                  <PopoverContent
                    align="start"
                    sideOffset={6}
                    className="w-44 p-1"
                  >
                    {(["All", ...VISIT_TYPE_OPTIONS] as (MedicalVisitType | "All")[]).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => {
                          handleFilterType(t);
                          setFilterOpen(false);
                        }}
                        className="flex w-full cursor-pointer items-center gap-2 rounded-md px-3 py-1.5 text-sm text-slate-700 transition hover:bg-slate-100"
                      >
                        <span className="flex-1 text-left">{t === "All" ? "All Visit Types" : t}</span>
                        {filterType === t && <Check className="h-3.5 w-3.5 text-slate-600" />}
                      </button>
                    ))}
                  </PopoverContent>
                </Popover>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-100 hover:text-rose-700"
                  >
                    <FilterX className="h-4 w-4" />
                    Clear
                  </button>
                )}
              </div>
            </div>
            {/* Cards */}
            {filteredRecords.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center">
                <Search className="mb-3 h-8 w-8 text-slate-300" />
                <p className="font-lexend text-sm font-semibold text-slate-600">No records match your search</p>
                <p className="mt-1 text-xs text-slate-400">Try adjusting the search or filter.</p>
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {pagedRecords.map((record) => (
                  <MedicalRecordCard key={record.recordId} record={record} onEdit={handleEdit} onVisitTypeChange={handleVisitTypeChange} />
                ))}
              </div>
            )}

            {/* Pagination */}
            {filteredRecords.length > PAGE_SIZE && (
              <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-500">
                  Showing{" "}
                  <span className="font-semibold text-slate-700">
                    {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredRecords.length)}
                  </span>{" "}
                  of <span className="font-semibold text-slate-700">{filteredRecords.length}</span> records
                </p>
                <div className="flex items-center gap-3">
                  <p className="text-sm text-slate-600">
                    Page {currentPage} of {totalPages}
                  </p>
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="cursor-pointer rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="cursor-pointer rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <EditMedicalRecordModal
        record={editRecord}
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onSaved={(updated) =>
          setRecords((prev) =>
            prev.map((r) => (r.recordId === updated.recordId ? updated : r))
          )
        }
      />
    </MedicalSidebarLayout>
  );
}
