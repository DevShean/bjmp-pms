"use client";

import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { X, CalendarIcon, UserPlus, ClipboardList } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import InmateMultiSelect from "../../components/InmateMultiSelect";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";
import IconButton from "@/components/ui/IconButton";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface AssignProgramModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: () => void;
    programId: string | null;
    programName: string | null;
}

export default function AssignProgramModal({ isOpen, onClose, onSubmit, programId, programName }: AssignProgramModalProps) {
    const [selectedInmateIds, setSelectedInmateIds] = useState<string[]>([]);
    const [startDate, setStartDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [rehabUserId, setRehabUserId] = useState<number | null>(null);

    // Fetch the current rehab user ID (matching hardcoded session in layout)
    useEffect(() => {
        async function getRehabId() {
            try {
                // Try specific email first
                const { data: specificData } = await supabase
                    .from("users")
                    .select("user_id")
                    .eq("email", "rehab@bjmp.portal")
                    .single();
                
                if (specificData) {
                    setRehabUserId(specificData.user_id);
                    return;
                }

                // Fallback: any Rehab Staff (role_id: 4)
                const { data: fallbackData } = await supabase
                    .from("users")
                    .select("user_id")
                    .eq("role_id", 4)
                    .limit(1)
                    .single();

                if (fallbackData) {
                    setRehabUserId(fallbackData.user_id);
                } else {
                    console.error("No rehabilitation staff found in database.");
                }
            } catch (err) {
                console.error("Error finding rehab user:", err);
            }
        }
        getRehabId();
    }, []);

    useEffect(() => {
        if (!isOpen) {
            setSelectedInmateIds([]);
            setStartDate(format(new Date(), "yyyy-MM-dd"));
        }
    }, [isOpen]);

    const handleAssign = async () => {
        if (!programId || selectedInmateIds.length === 0 || !rehabUserId) {
            if (!rehabUserId) toast.error("Rehab staff user ID not found.");
            else if (selectedInmateIds.length === 0) toast.error("Please select at least one inmate.");
            return;
        }

        setIsSubmitting(true);
        try {
            const invitations = selectedInmateIds.map(inmateId => ({
                inmate_id: parseInt(inmateId),
                program_id: parseInt(programId),
                staff_id: rehabUserId,
                start_date: startDate,
                progress: "Ongoing"
            }));

            const { error } = await supabase.from("inmate_programs").insert(invitations);

            if (error) throw error;

            toast.success(`Successfully assigned ${selectedInmateIds.length} inmates!`);
            onSubmit();
            onClose();
        } catch (err: unknown) {
            console.error("Assignment error:", err);
            toast.error(`Assignment failed: ${(err as Error).message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent 
                className="flex w-full max-w-2xl min-w-[500px] flex-col rounded-2xl bg-white shadow-2xl overflow-hidden border-none p-0"
                showCloseButton={false}
            >
                {/* Header */}
                <div className="flex items-center justify-between border-b bg-blue-700 px-6 py-4 text-white">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
                            <UserPlus size={22} className="text-white" />
                        </div>
                        <div>
                            <h2 className="font-lexend text-xl font-semibold leading-tight">Assign Inmates</h2>
                            <p className="text-xs text-blue-100 flex items-center gap-1.5 mt-0.5 uppercase tracking-wider font-medium">
                                Assigning to: {programName || "Program"}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-full p-2 text-white/80 transition hover:bg-white/20 hover:text-white cursor-pointer"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 min-h-0 px-6 py-8 space-y-6">
                    <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-wide text-slate-600 font-lexend">
                            Select Inmates
                        </label>
                        <InmateMultiSelect 
                            selectedIds={selectedInmateIds} 
                            onValueChange={setSelectedInmateIds}
                            placeholder="Search and select multiple inmates..."
                        />
                        <p className="text-[10px] text-slate-400 mt-1">
                            You can assign one or more inmates to this program simultaneously.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-wide text-slate-600 font-lexend">
                            Program Start Date
                        </label>
                        <DatePickerField 
                            value={startDate} 
                            onSelect={(date) => setStartDate(date ? format(date, "yyyy-MM-dd") : "")} 
                        />
                        <p className="text-[10px] text-slate-400 mt-1">
                            This date marks when the inmates&apos; participation officially begins.
                        </p>
                    </div>
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
                        onClick={handleAssign}
                        icon={<ClipboardList size={18} />}
                        colorClass="bg-blue-700 hover:bg-blue-800 text-white"
                        disabled={isSubmitting || selectedInmateIds.length === 0}
                    >
                        {isSubmitting ? "Assigning..." : `Assign ${selectedInmateIds.length || ""} Inmate${selectedInmateIds.length !== 1 ? "s" : ""}`}
                    </IconButton>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function DatePickerField({ value, onSelect }: {
    value: string;
    onSelect: (date: Date | undefined) => void;
}) {
    const selected = value ? new Date(value + "T12:00:00") : undefined;
    return (
        <div className="w-full">
            <Popover>
                <PopoverTrigger
                    className="flex w-full cursor-pointer items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-teal-500/20"
                >
                    <span className={selected ? "text-slate-800 font-medium" : "text-slate-500"}>
                        {selected ? format(selected, "PPP") : "Select a start date"}
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
