import React, { useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface DeleteProgramModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: () => void;
    programId: string | null;
    programName: string | null;
}

export default function DeleteProgramModal({ isOpen, onClose, onSubmit, programId, programName }: DeleteProgramModalProps) {
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        if (!programId) return;

        setIsDeleting(true);
        try {
            const numericId = parseInt(programId, 10);
            const { error } = await supabase.from("programs").delete().eq("program_id", numericId);

            if (error) throw error;

            toast.success("Program deleted successfully.");
            onSubmit();
            onClose();
        } catch (err: unknown) {
            console.error("Delete error:", err);
            toast.error("Failed to delete program.");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent 
                className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden text-center border-none p-0"
                showCloseButton={false}
            >
                <div className="bg-rose-50 px-6 py-8 flex flex-col items-center relative">
                    <button
                        type="button"
                        onClick={onClose}
                        className="absolute right-4 top-4 rounded-full p-1.5 text-rose-300 transition hover:bg-rose-100 hover:text-rose-500 cursor-pointer"
                        aria-label="Close modal"
                    >
                        <X size={18} />
                    </button>
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                        <AlertTriangle size={32} />
                    </div>
                    <h2 className="font-lexend text-xl font-bold text-slate-800 tracking-tight">Confirm Deletion</h2>
                    <p className="mt-2 text-sm text-slate-600 leading-relaxed px-5">
                        Are you sure you want to delete the program<br/>
                        <span className="font-semibold text-slate-900">{programName || "this program"}</span>?<br/>
                        This action is permanent and cannot be undone.
                    </p>
                </div>

                <div className="flex items-center gap-3 px-6 py-5 bg-white border-t border-slate-100">
                    <button
                        onClick={onClose}
                        disabled={isDeleting}
                        className="flex-1 rounded-lg border border-slate-300 bg-white py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="flex-1 rounded-lg bg-rose-600 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50 transition cursor-pointer shadow-sm shadow-rose-200"
                    >
                        {isDeleting ? "Deleting..." : "Delete Program"}
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
