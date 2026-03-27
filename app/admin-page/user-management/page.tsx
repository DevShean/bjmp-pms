"use client";

import { useState, useEffect, useCallback } from "react";
import AdminSidebarLayout from "../components/AdminSidebarLayout";
import UserDataTable, { UserRecord } from "../components/UserDataTable";
import AddUserModal, { AddUserFormData } from "../components/AddUserModal";
import EditUserModal, { EditUserFormData } from "../components/EditUserModal";
import DeleteUserModal from "../components/DeleteUserModal";
import { Search, Filter, UserPlus } from "lucide-react";
import IconButton from "@/components/ui/IconButton";
import { supabase } from "../../../lib/supabase/client";
import { toast } from "sonner";
import { UserCog } from "lucide-react";

type Role = {
  role_id: number;
  role_name: string;
};

interface UserResponse {
  user_id: number;
  username: string;
  email: string;
  role_id: number;
  roles: { role_name: string } | { role_name: string }[] | null;
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [viewMode, setViewMode] = useState<"Staff" | "Visitor">("Staff");
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editUser, setEditUser] = useState<UserRecord | null>(null);
  const [deleteUser, setDeleteUser] = useState<UserRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select(`
        user_id,
        username,
        email,
        role_id,
        roles!inner(role_name)
      `);

    if (userError) {
      console.error("Error fetching users:", userError);
    } else if (userData) {
      const formattedUsers: UserRecord[] = (userData as unknown as UserResponse[]).map((u) => {
        const roleData = Array.isArray(u.roles) ? u.roles[0] : u.roles;
        return {
          id: u.user_id.toString(),
          username: u.username,
          email: u.email,
          role: roleData?.role_name || "Unknown",
          role_id: u.role_id
        };
      });
      setUsers(formattedUsers);
    }

    const { data: roleData, error: roleError } = await supabase
      .from("roles")
      .select("*")
      .order("role_name");
      
    if (roleError) {
      console.error("Error fetching roles:", roleError);
    } else if (roleData) {
      setRoles(roleData);
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      if (isMounted) {
        await fetchUsers();
      }
    };
    loadData();
    return () => { isMounted = false; };
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

  const handleCreateUser = async (data: AddUserFormData, reset: () => void) => {
    const { error } = await supabase.from("users").insert([
      {
        username: data.username,
        email: data.email,
        password: data.password, 
        role_id: parseInt(data.role, 10), // Now sending role_id as string/number from select
      },
    ]);

    if (error) {
      console.error("Error inserting user:", error);
      toast.error("Failed to create user: " + error.message);
    } else {
      toast.success("User created successfully!");
      fetchUsers();
      reset();
    }
  };

  async function handleEditUser(data: EditUserFormData) {
    if (!editUser) return;
    
    const { error } = await supabase
      .from("users")
      .update({
        username: data.username,
        email: data.email,
        role_id: parseInt(data.role, 10),
      })
      .eq("user_id", editUser.id);

    if (error) {
      toast.error("Failed to update user: " + error.message);
    } else {
      toast.success("User updated successfully!");
      fetchUsers();
      setEditUser(null);
    }
  }

  return (
    <AdminSidebarLayout>
      <div className="flex flex-col gap-6 p-2 md:p-6 w-full">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex flex-col gap-2">
            <h1 className="font-lexend text-3xl font-semibold text-slate-800 flex items-center gap-3">
              User Management
              <UserCog className="text-teal-700" size={32} />
            </h1>
            <p className="text-sm text-slate-600">
              Manage staff accounts, administrative roles, and system access permissions.
            </p>
            <div className="inline-flex bg-slate-100/80 p-1 rounded-xl border border-slate-200/50 w-fit">
              <button
                onClick={() => setViewMode("Staff")}
                className={`cursor-pointer px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${
                  viewMode === "Staff"
                    ? "bg-white text-teal-700 shadow-xs border border-slate-200"
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                }`}
              >
                Staff
              </button>
              <button
                onClick={() => setViewMode("Visitor")}
                className={`cursor-pointer px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${
                  viewMode === "Visitor"
                    ? "bg-white text-teal-700 shadow-xs border border-slate-200"
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                }`}
              >
                Visitor
              </button>
            </div>
          </div>
          <IconButton
            onClick={() => setIsModalOpen(true)}
            icon={<UserPlus size={18} className="-ml-1" />}
            colorClass="bg-teal-700 hover:bg-teal-800 text-white"
          >
            Add New User
          </IconButton>
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
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all bg-slate-50/50 focus:bg-white"
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
                  className="pl-9 pr-8 py-2 w-full sm:w-48 appearance-none border border-slate-200 rounded-lg text-sm text-slate-700 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all cursor-pointer font-medium"
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
        roles={roles}
      />
      <EditUserModal
        isOpen={!!editUser}
        onClose={() => setEditUser(null)}
        user={editUser}
        onSubmit={handleEditUser}
        roles={roles}
      />
      <DeleteUserModal
        isOpen={!!deleteUser}
        onClose={() => setDeleteUser(null)}
        onSubmit={fetchUsers}
        userId={deleteUser?.id ?? null}
        username={deleteUser?.username ?? null}
      />
    </AdminSidebarLayout>
  );
}
