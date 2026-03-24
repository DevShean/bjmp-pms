"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { UserRecord } from "./UserDataTable";

export interface EditUserFormData {
  username: string;
  email: string;
  role: string;
}

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserRecord | null;
  onSubmit: (data: EditUserFormData) => void;
}

export default function EditUserModal({ isOpen, onClose, user, onSubmit }: EditUserModalProps) {
  const initialForm = user
    ? { username: user.username, email: user.email, role: user.role }
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
    handleClose();
  }

  if (!user) return null;
  return (
    <AnimatePresence>
      {isOpen && (
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
            <div className="flex items-center justify-between border-b border-slate-200 bg-blue-600 px-6 py-4">
              <h2 className="text-lg font-bold text-white" id="modal-title">Edit User</h2>
              <button onClick={handleClose} className="text-white hover:text-slate-200">
                <X size={20} />
              </button>
            </div>
            <form className="p-6 flex flex-col gap-4" onSubmit={handleSubmit}>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Username</label>
                <input
                  type="text"
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  className="w-full rounded-lg border bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none placeholder:text-slate-400 transition border-slate-300 focus:border-blue-500 focus:ring-2 ring-blue-500"
                  required
                  minLength={3}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  className="w-full rounded-lg border bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none placeholder:text-slate-400 transition border-slate-300 focus:border-blue-500 focus:ring-2 ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Role</label>
                <select
                  name="role"
                  value={form.role}
                  onChange={handleChange}
                  className="w-full rounded-lg border bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none transition border-slate-300 focus:border-blue-500 focus:ring-2 ring-blue-500"
                  required
                >
                  <option value="">Select role</option>
                  <option value="Admin">Admin</option>
                  <option value="Medical Staff">Medical Staff</option>
                  <option value="Guard">Guard</option>
                  <option value="Warden">Warden</option>
                  <option value="Visitor">Visitor</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 mt-2">
                <button type="button" onClick={handleClose} className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 font-medium hover:bg-slate-200 transition">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition">Save Changes</button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
