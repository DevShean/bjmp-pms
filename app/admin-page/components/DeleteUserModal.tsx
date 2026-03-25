"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { AlertTriangle } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";

interface DeleteUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: () => void;
    userId: string | null;
    username: string | null;
}

export default function DeleteUserModal({ isOpen, onClose, onSubmit, userId, username }: DeleteUserModalProps) {
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        if (!userId) return;

        setIsDeleting(true);
        try {
            const { error } = await supabase.from("users").delete().eq("user_id", userId);

            if (error) throw error;

            toast.success("User record deleted successfully.");
            onSubmit();
            onClose();
        } catch (err) {
            console.error("Delete error:", err);
            toast.error("Failed to delete user record.");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                >
                    <motion.div
                        className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden text-center"
                        initial={{ opacity: 0, scale: 0.94, y: 24 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.94, y: 24 }}
                        transition={{ type: "spring", duration: 0.38 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="bg-rose-50 px-6 py-8 flex flex-col items-center">
                            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                                <AlertTriangle size={32} />
                            </div>
                            <h2 className="font-lexend text-xl font-bold text-slate-800 tracking-tight">Confirm Deletion</h2>
                            <p className="mt-2 text-sm text-slate-600 leading-relaxed px-2">
                                Are you sure you want to delete the user account for<br/>
                                <span className="font-semibold text-slate-900">{username || userId}</span>?<br/>
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
                                {isDeleting ? "Deleting..." : "Delete User"}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
