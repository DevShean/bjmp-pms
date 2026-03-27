import React, { useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface DeleteInmateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: () => void;
    inmateId: string | null;
    inmateName: string | null;
}

export default function DeleteInmateModal({ isOpen, onClose, onSubmit, inmateId, inmateName }: DeleteInmateModalProps) {
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        if (!inmateId) return;

        setIsDeleting(true);
        try {
            const numericId = parseInt(inmateId.replace("INM-", ""), 10);
            
            // 1. Fetch inmate to get photo_path first
            const { data: inmateData, error: fetchError } = await supabase
                .from("inmates")
                .select("photo_path")
                .eq("inmate_id", numericId)
                .single();

            if (fetchError) throw fetchError;

            // 2. Try to delete from storage if photo exists
            if (inmateData?.photo_path && inmateData.photo_path.includes("inmate-photos")) {
                try {
                    let oldPath = "";
                    if (inmateData.photo_path.startsWith("http")) {
                        const url = new URL(inmateData.photo_path);
                        const pathSegments = url.pathname.split("inmate-photos/");
                        if (pathSegments.length > 1) {
                            oldPath = decodeURIComponent(pathSegments[1]);
                        }
                    } else if (inmateData.photo_path.startsWith("/inmate-photos/")) {
                        console.log("Old local photo path detected, skipping storage deletion.");
                    }

                    if (oldPath) {
                        await supabase.storage.from("inmate-photos").remove([oldPath]);
                    }
                } catch (e) {
                    console.error("Cleanup error (ignorable):", e);
                }
            }

            // 3. Manual Cascade: Delete related records in other tables
            // This is necessary because the schema doesn't have ON DELETE CASCADE
            const relatedTables = [
                "behavior_logs",
                "incidents",
                "inmate_programs",
                "medical_records",
                "releases",
                "transfers",
                "visitations"
            ];

            for (const table of relatedTables) {
                const { error: relError } = await supabase
                    .from(table)
                    .delete()
                    .eq("inmate_id", numericId);
                
                if (relError) {
                    console.warn(`Could not clean up ${table}:`, relError.message);
                    // We continue anyway, the final delete will fail if it's a hard constraint
                }
            }

            // 4. Finally, delete the inmate record
            const { error: deleteError } = await supabase
                .from("inmates")
                .delete()
                .eq("inmate_id", numericId);

            if (deleteError) {
                if (deleteError.code === "23503") {
                    throw new Error("Cannot delete inmate: This record is still referenced by other data. Please contact an administrator to clean up database constraints.");
                }
                throw deleteError;
            }

            toast.success("Inmate record deleted successfully.");
            onSubmit();
            onClose();
        } catch (err: unknown) {
            console.error("Delete error:", err);
            toast.error(`Delete failed: ${(err as Error).message}`);
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
                        Are you sure you want to delete the record for<br/>
                        <span className="font-semibold text-slate-900">{inmateName || inmateId}</span>?<br/>
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
                        {isDeleting ? "Deleting..." : "Delete Record"}
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
