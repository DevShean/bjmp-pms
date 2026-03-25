"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { X, User } from "lucide-react";
import { UserRecord } from "./UserDataTable";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
    <AnimatePresence>
      {(isOpen && user) && (
        <motion.div
          key={`edit-user-modal-${user.id || ''}`}
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
            <div className="flex items-center justify-between border-b border-slate-200 bg-teal-700 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
                  <User size={18} className="text-white" />
                </div>
                <div>
                  <p id="modal-title" className="font-lexend text-lg font-semibold text-white leading-tight">
                    Edit User Profile
                  </p>
                  <p className="text-xs text-teal-100 italic">User ID: {user.id}</p>
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
            <div className="flex items-center justify-end border-t border-slate-200 bg-slate-50 px-6 py-4 rounded-b-2xl">
              <IconButton
                onClick={handleSubmit}
                icon={<User size={18} />}
                colorClass="bg-teal-700 hover:bg-teal-800 text-white"
              >
                Save Changes
              </IconButton>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
