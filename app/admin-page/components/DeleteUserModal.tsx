"use client";

import { useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogClose } from "@/components/ui/dialog";

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
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-md p-0 overflow-hidden border-none rounded-2xl shadow-2xl gap-0" showCloseButton={false}>
                <DialogHeader className="bg-rose-50 px-6 py-8 flex flex-col items-center space-y-0 text-center relative">
                    <DialogClose render={<button className="absolute top-4 right-4 rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer outline-none" />}>
                        <X size={20} />
                    </DialogClose>
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                        <AlertTriangle size={32} />
                    </div>
                    <DialogTitle className="font-lexend text-xl font-bold text-slate-800 tracking-tight">
                        Confirm Deletion
                    </DialogTitle>
                    <DialogDescription className="mt-2 text-sm text-slate-600 leading-relaxed px-2">
                        Are you sure you want to delete the user account for<br/>
                        <span className="font-semibold text-slate-900">{username || userId}</span>?<br/>
                        This action is permanent and cannot be undone.
                    </DialogDescription>
                </DialogHeader>

                <DialogFooter className="m-0 flex items-center gap-3 px-6 py-5 bg-white border-t border-slate-100 sm:justify-center">
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
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
