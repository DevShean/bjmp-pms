"use client";

import { useState, useEffect, useCallback } from "react";
import AdminSidebarLayout from "../components/AdminSidebarLayout";
import UserDataTable, { UserRecord } from "../components/UserDataTable";
import AddUserModal, { AddUserFormData } from "../components/AddUserModal";
import EditUserModal, { EditUserFormData } from "../components/EditUserModal";
import { Button } from "../../../components/ui/button";
import { Plus, Search, Filter } from "lucide-react";
import { supabase } from "../../../lib/supabase/client";

// Map DB UI Role to DB role_id for AddUserModal creation
const mapRoleToRoleId = (role: string): number => {
  switch (role) {
    case "Admin": return 1; // Administrator
    case "Guard": return 2; // Correctional Officer
    case "Medical Staff": return 3; // Medical Staff
    case "Warden": return 1; // Warden maps to Admin per schema
    default: return 1;
  }
};

export default function UserManagementPage() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [viewMode, setViewMode] = useState<"Staff" | "Visitor">("Staff");
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editUser, setEditUser] = useState<UserRecord | null>(null);
  const [deleteUser, setDeleteUser] = useState<UserRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUsers = useCallback(async () => {
    const { data, error } = await supabase
      .from("users")
      .select(`
        user_id,
        username,
        email,
        roles!inner(role_name)
      `);

    if (error) {
      console.error("Error fetching users:", error);
    } else if (data) {
      const formattedUsers: UserRecord[] = data.map((u: { user_id: number; username: string; email: string; roles: { role_name: string } | { role_name: string }[] | null }) => {
        const roleData = Array.isArray(u.roles) ? u.roles[0] : u.roles;
        return {
          id: u.user_id.toString(),
          username: u.username,
          email: u.email,
          role: roleData?.role_name || "Unknown",
        };
      });
      setUsers(formattedUsers);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line
    fetchUsers();
  }, [fetchUsers]);

  const filteredUsers = users.filter((user) => {
    const matchesViewMode =
      viewMode === "Staff" ? user.role !== "Visitor" : user.role === "Visitor";
      
    const matchesSearch =
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesRole = roleFilter === "All" || user.role === roleFilter;
    
    return matchesViewMode && matchesSearch && matchesRole;
  });

  const handleCreateUser = async (data: AddUserFormData) => {
    const roleId = mapRoleToRoleId(data.role);

    const { error } = await supabase.from("users").insert([
      {
        username: data.username,
        email: data.email,
        password: data.password, 
        role_id: roleId,
      },
    ]);

    if (error) {
      console.error("Error inserting user:", error);
      alert("Failed to create user: " + error.message);
    } else {
      fetchUsers();
    }
  };

  async function handleEditUser(data: EditUserFormData) {
    if (!editUser) return;
    // Update user in supabase
    const { error } = await supabase
      .from("users")
      .update({
        username: data.username,
        email: data.email,
        role_id: mapRoleToRoleId(data.role),
      })
      .eq("user_id", editUser.id);
    if (error) {
      alert("Failed to update user: " + error.message);
    } else {
      fetchUsers();
    }
  }

  async function handleDeleteUser() {
    if (!deleteUser) return;
    setIsDeleting(true);
    const { error } = await supabase
      .from("users")
      .delete()
      .eq("user_id", deleteUser.id);
    setIsDeleting(false);
    setDeleteUser(null);
    if (error) {
      alert("Failed to delete user: " + error.message);
    } else {
      fetchUsers();
    }
  }

  return (
    <AdminSidebarLayout>
      <div className="flex flex-col gap-6 p-2 md:p-6 w-full">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex flex-col gap-2">
            <h1 className="font-lexend text-3xl font-extrabold text-slate-800">
              User Management
            </h1>
            <div className="inline-flex bg-slate-100/80 p-1 rounded-xl border border-slate-200/50">
              <button
                onClick={() => setViewMode("Staff")}
                className={`cursor-pointer px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${
                  viewMode === "Staff"
                    ? "bg-white text-blue-700 shadow-xs border border-slate-200"
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                }`}
              >
                Staff
              </button>
              <button
                onClick={() => setViewMode("Visitor")}
                className={`cursor-pointer px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${
                  viewMode === "Visitor"
                    ? "bg-white text-blue-700 shadow-xs border border-slate-200"
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                }`}
              >
                Visitor
              </button>
            </div>
          </div>
          <Button 
            onClick={() => setIsModalOpen(true)}
            className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white gap-2 px-5 py-2 h-auto rounded-lg shadow-sm transition-colors text-sm font-medium"
          >
            <Plus size={18} />
            Add New User
          </Button>
        </div>

        {/* Filters and Controls */}
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col sm:flex-row gap-4 items-center">
          <div className="relative w-full sm:w-96">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
              <Search size={18} />
            </div>
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all bg-slate-50/50 focus:bg-white"
            />
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {viewMode === "Staff" && (
              <div className="relative w-full sm:w-auto">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                  <Filter size={16} />
                </div>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="pl-9 pr-8 py-2 w-full sm:w-48 appearance-none border border-slate-200 rounded-lg text-sm text-slate-700 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all cursor-pointer font-medium"
                >
                  <option value="All">All Roles</option>
                  {Array.from(new Set(users.filter(u => u.role !== "Visitor").map(u => u.role)))
                    .sort()
                    .map((role) => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* User DataTable */}
        <div>
          {isLoading ? (
            <div className="rounded-xl border border-slate-200 bg-white p-12 flex items-center justify-center text-slate-500">
              <p>Loading users...</p>
            </div>
          ) : (
            <UserDataTable
              data={filteredUsers}
              onEdit={setEditUser}
              onDelete={setDeleteUser}
            />
          )}
        </div>
      </div>

      <AddUserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateUser}
      />
      <EditUserModal
        isOpen={!!editUser}
        onClose={() => setEditUser(null)}
        user={editUser}
        onSubmit={handleEditUser}
      />
      {/* Delete confirmation modal */}
      {deleteUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.55)" }}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200">
              <h2 className="text-lg font-bold text-slate-800">Delete User</h2>
            </div>
            <div className="p-6 flex flex-col gap-4">
              <p>Are you sure you want to delete <span className="font-semibold">{deleteUser.username}</span>?</p>
              <div className="flex justify-end gap-2">
                <button
                  className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 font-medium hover:bg-slate-200 transition"
                  onClick={() => setDeleteUser(null)}
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 rounded-lg bg-rose-600 text-white font-medium hover:bg-rose-700 transition"
                  onClick={handleDeleteUser}
                  disabled={isDeleting}
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminSidebarLayout>
  );
}
