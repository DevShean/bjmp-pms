"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { UserPlus, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import IconButton from "@/components/ui/IconButton";

export interface AddUserFormData {
    username: string;
    email: string;
    password: string;
    role: string;
}

interface AddUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: AddUserFormData) => void;
}

function Field({ label, id, error, children }: { label: string; id: string; error?: string; children: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-1.5 relative">
            <label htmlFor={id} className="text-xs font-semibold text-slate-600 uppercase tracking-wide font-lexend">
                {label}
            </label>
            <div className="relative">{children}</div>
            {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
        </div>
    );
}

const inputClass = "w-full rounded-lg border bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none placeholder:text-slate-400 transition pr-9 border-slate-300 focus:border-blue-500 focus:ring-2 ring-blue-500";

export default function AddUserModal({ isOpen, onClose, onSubmit }: AddUserModalProps) {
    const [form, setForm] = useState<AddUserFormData>({
        username: "",
        email: "",
        password: "",
        role: ""
    });
    
    const [errors, setErrors] = useState<Partial<AddUserFormData>>({});

    function handleClose() {
        setForm({
            username: "", email: "", password: "", role: ""
        });
        setErrors({});
        onClose();
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
        if (errors[e.target.name as keyof AddUserFormData]) {
            setErrors(prev => ({ ...prev, [e.target.name]: undefined }));
        }
    };

    const handleFieldChange = (name: string, value: string) => {
        setForm(prev => ({ ...prev, [name]: value }));
        if (errors[name as keyof AddUserFormData]) {
            setErrors(prev => ({ ...prev, [name]: undefined }));
        }
    };

    const validate = () => {
        const newErrors: Partial<AddUserFormData> = {};
        if (!form.username || form.username.trim().length < 3) {
            newErrors.username = "Username must be at least 3 characters.";
        }
        if (!form.email || !/^\S+@\S+\.\S+$/.test(form.email)) {
            newErrors.email = "Please enter a valid email address.";
        }
        if (!form.password || form.password.length < 6) {
            newErrors.password = "Password must be at least 6 characters.";
        }
        if (!form.role) {
            newErrors.role = "Please select a role.";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = () => {
        if (validate()) {
            onSubmit(form);
            handleClose();
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    key="add-user-modal"
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    style={{ backgroundColor: "rgba(0,0,0,0.55)" }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    onClick={(e) => {
                        if (e.target === e.currentTarget) handleClose();
                    }}
                    aria-modal="true"
                    role="dialog"
                    aria-labelledby="modal-title"
                >
                    <motion.div
                        className="relative flex w-full max-w-md flex-col rounded-2xl bg-white shadow-2xl overflow-hidden"
                        initial={{ opacity: 0, scale: 0.94, y: 24 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.94, y: 24 }}
                        transition={{ type: "spring", duration: 0.38, bounce: 0.18 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-slate-200 bg-blue-600 px-6 py-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
                                    <UserPlus size={18} className="text-white" />
                                </div>
                                <div>
                                    <p id="modal-title" className="font-lexend text-lg font-semibold text-white leading-tight">
                                        Add New User
                                    </p>
                                    <p className="text-xs text-blue-100">User Details</p>
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

                        {/* Body */}
                        <div className="flex-1 overflow-y-auto px-6 py-5">
                            <form className="flex flex-col gap-4">
                                <Field label="Username" id="username" error={errors.username}>
                                    <input type="text" id="username" name="username" value={form.username} onChange={handleChange} className={inputClass} placeholder="e.g. johndoe" />
                                </Field>

                                <Field label="Email Address" id="email" error={errors.email}>
                                    <input type="email" id="email" name="email" value={form.email} onChange={handleChange} className={inputClass} placeholder="e.g. user@bjmp.gov.ph" />
                                </Field>

                                <Field label="Password" id="password" error={errors.password}>
                                    <input type="password" id="password" name="password" value={form.password} onChange={handleChange} className={inputClass} placeholder="Enter a secure password" />
                                </Field>

                                <div>
                                    <Field label="Role" id="role" error={errors.role}>
                                        <Select value={form.role} onValueChange={(val) => handleFieldChange("role", val || "")}> 
                                            <SelectTrigger className={`w-full bg-slate-50 ${errors.role ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-300'}`}>
                                                <SelectValue placeholder="Select role" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Admin">Admin</SelectItem>
                                                <SelectItem value="Medical Staff">Medical Staff</SelectItem>
                                                <SelectItem value="Guard">Guard</SelectItem>
                                                <SelectItem value="Warden">Warden</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </Field>
                                </div>
                            </form>
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-end border-t border-slate-200 bg-slate-50 px-6 py-4 rounded-b-2xl">
                            <IconButton
                                onClick={handleSubmit}
                                icon={<UserPlus size={18} />}
                                colorClass="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                                Create User
                            </IconButton>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
