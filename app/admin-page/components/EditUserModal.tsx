"use client";

import { useState, useEffect } from "react";
import { X, User } from "lucide-react";
import { UserRecord } from "./UserDataTable";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogClose } from "@/components/ui/dialog";
import IconButton from "@/components/ui/IconButton";

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

export interface EditUserFormData {
  username: string;
  email: string;
  role: string;
}

export type Role = {
  role_id: number;
  role_name: string;
};

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserRecord | null;
  onSubmit: (data: EditUserFormData) => void;
  roles: Role[];
}

export default function EditUserModal({ isOpen, onClose, user, onSubmit, roles }: EditUserModalProps) {
  const initialForm = user
    ? { username: user.username, email: user.email, role: String(user.role_id) }
    : { username: "", email: "", role: "" };
  const [form, setForm] = useState<EditUserFormData>(initialForm);

  useEffect(() => {
    setForm(initialForm);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isOpen]);

  function handleClose() {
    onClose();
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit(form);
  }

  return (
    <Dialog open={isOpen && !!user} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-md p-0 overflow-hidden border-none rounded-2xl shadow-2xl gap-0" showCloseButton={false}>
        <DialogHeader className="bg-teal-700 px-6 py-4 space-y-0 text-left relative flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
              <User size={18} className="text-white" />
            </div>
            <div>
              <DialogTitle className="font-lexend text-lg font-semibold text-white leading-tight">
                Edit User Profile
              </DialogTitle>
              <DialogDescription className="text-xs text-teal-100 italic">
                Update details for User ID: {user?.id}
              </DialogDescription>
            </div>
          </div>
          <DialogClose render={<button className="rounded-full p-1.5 text-white/80 hover:bg-white/10 hover:text-white transition-colors cursor-pointer outline-none" />}>
            <X size={20} />
          </DialogClose>
        </DialogHeader>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <Field label="Username" id="username">
              <input
                type="text"
                id="username"
                name="username"
                value={form.username}
                onChange={handleChange}
                className={inputClass}
                placeholder="e.g. johndoe"
                required
                minLength={3}
              />
            </Field>

            <Field label="Email Address" id="email">
              <input
                type="email"
                id="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className={inputClass}
                placeholder="e.g. user@bjmp.gov.ph"
                required
              />
            </Field>

            <Field label="Role" id="role">
              <Select value={form.role} onValueChange={(val) => setForm(prev => ({ ...prev, role: val || "" }))}>
                <SelectTrigger className="w-full bg-slate-50 border-slate-300">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((r) => (
                    <SelectItem key={r.role_id} value={String(r.role_id)}>
                      {r.role_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </form>
        </div>

        {/* Footer */}
        <DialogFooter className="m-0 border-t border-slate-200 bg-slate-50 px-6 py-4 sm:justify-end">
          <IconButton
            onClick={handleSubmit}
            icon={<User size={18} />}
            colorClass="bg-teal-700 hover:bg-teal-800 text-white"
          >
            Save Changes
          </IconButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
