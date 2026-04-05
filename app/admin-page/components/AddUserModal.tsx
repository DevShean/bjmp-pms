"use client";

import { useState } from "react";
import { UserPlus, X, ChevronDown, Check } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogClose } from "@/components/ui/dialog";
import IconButton from "@/components/ui/IconButton";

export interface AddUserFormData {
    username: string;
    email: string;
    password: string;
    role: string;
}

export type Role = {
    role_id: number;
    role_name: string;
};

interface AddUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: AddUserFormData, reset: () => void) => void;
    roles: Role[];
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

const inputClass = "w-full rounded-lg border bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none placeholder:text-slate-400 transition pr-9 border-slate-300 focus:border-teal-500 focus:ring-2 ring-teal-500";

export default function AddUserModal({ isOpen, onClose, onSubmit, roles }: AddUserModalProps) {
    const [form, setForm] = useState<AddUserFormData>({
        username: "",
        email: "",
        password: "",
        role: ""
    });
    
    const [errors, setErrors] = useState<Partial<AddUserFormData>>({});
    const [roleOpen, setRoleOpen] = useState(false);

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
            onSubmit(form, handleClose);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <DialogContent className="max-w-md p-0 overflow-hidden border-none rounded-2xl shadow-2xl gap-0" showCloseButton={false}>
                <DialogHeader className="bg-teal-700 px-6 py-4 space-y-0 text-left relative flex-row items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
                            <UserPlus size={18} className="text-white" />
                        </div>
                        <div>
                            <DialogTitle className="font-lexend text-lg font-semibold text-white leading-tight">
                                Add New User
                            </DialogTitle>
                            <DialogDescription className="text-xs text-teal-100">
                                Enter user details to create a new system account.
                            </DialogDescription>
                        </div>
                    </div>
                    <DialogClose render={<button className="rounded-full p-1.5 text-white/80 hover:bg-white/10 hover:text-white transition-colors cursor-pointer outline-none" />}>
                        <X size={20} />
                    </DialogClose>
                </DialogHeader>

                <div className="px-6 py-6">
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
                                <Popover open={roleOpen} onOpenChange={setRoleOpen}>
                                    <PopoverTrigger
                                        id="role"
                                        className={`flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg border bg-slate-50 px-3 py-2 text-sm outline-none transition hover:bg-slate-100 ${errors.role ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-300'}`}
                                    >
                                        <span className={form.role ? "text-slate-800" : "text-slate-400"}>
                                            {form.role ? roles.find(r => String(r.role_id) === form.role)?.role_name : "Select role"}
                                        </span>
                                        <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${roleOpen ? "rotate-180" : ""}`} />
                                    </PopoverTrigger>
                                    <PopoverContent align="start" sideOffset={6} className="w-48 p-1">
                                        {roles.map((r) => (
                                            <button key={r.role_id} type="button" onClick={() => { handleFieldChange("role", String(r.role_id)); setRoleOpen(false); }} className="flex w-full cursor-pointer items-center gap-2 rounded-md px-3 py-1.5 text-sm text-slate-700 transition hover:bg-slate-100">
                                                <span className="flex-1 text-left">{r.role_name}</span>
                                                {form.role === String(r.role_id) && <Check className="h-3.5 w-3.5 text-teal-600" />}
                                            </button>
                                        ))}
                                    </PopoverContent>
                                </Popover>
                            </Field>
                        </div>
                    </form>
                </div>

                <DialogFooter className="m-0 border-t border-slate-200 bg-slate-50 px-6 py-4 sm:justify-end">
                    <IconButton
                        onClick={handleSubmit}
                        icon={<UserPlus size={18} />}
                        colorClass="bg-teal-700 hover:bg-teal-800 text-white"
                    >
                        Create User
                    </IconButton>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
