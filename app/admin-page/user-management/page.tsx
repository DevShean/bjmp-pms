"use client";

import { useState, useEffect, useCallback } from "react";
import AdminSidebarLayout from "../components/AdminSidebarLayout";
import UserDataTable, { UserRecord } from "../components/UserDataTable";
import AddUserModal, { AddUserFormData } from "../components/AddUserModal";
import EditUserModal, { EditUserFormData } from "../components/EditUserModal";
import DeleteUserModal from "../components/DeleteUserModal";
import { Search, Filter, FilterX, UserPlus, ChevronDown, Check } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
  const [roleFilterOpen, setRoleFilterOpen] = useState(false);

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
      <section className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex flex-col gap-2">
            <h1 className="font-lexend text-2xl font-semibold text-slate-800 flex items-center gap-3 sm:text-3xl">
              User Management
              <UserCog className="text-teal-700 shrink-0" size={32} />
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Manage staff accounts, administrative roles, and system access permissions.
            </p>
            <div className="inline-flex mt-2 bg-slate-100/80 p-1 rounded-xl border border-slate-200/50 w-fit">
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
              <>
                <Popover open={roleFilterOpen} onOpenChange={setRoleFilterOpen}>
                  <PopoverTrigger className="flex min-w-44 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm font-medium transition-all focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/50 cursor-pointer">
                    <Filter size={16} className="text-slate-400 shrink-0" />
                    <span className={roleFilter !== "All" ? "text-slate-700" : "text-slate-400"}>
                      {roleFilter === "All" ? "All Roles" : roleFilter}
                    </span>
                    <ChevronDown size={14} className={`ml-auto shrink-0 text-slate-400 transition-transform ${roleFilterOpen ? "rotate-180" : ""}`} />
                  </PopoverTrigger>
                  <PopoverContent align="start" sideOffset={6} className="w-48 p-1">
                    <button type="button" onClick={() => { setRoleFilter("All"); setRoleFilterOpen(false); }} className="flex w-full cursor-pointer items-center gap-2 rounded-md px-3 py-1.5 text-sm text-slate-700 transition hover:bg-slate-100">
                      <span className="flex-1 text-left">All Roles</span>
                      {roleFilter === "All" && <Check className="h-3.5 w-3.5 text-teal-600" />}
                    </button>
                    {Array.from(new Set(users.filter(u => u.role !== "Visitor").map(u => u.role)))
                      .sort()
                      .map((role) => (
                        <button key={role} type="button" onClick={() => { setRoleFilter(role); setRoleFilterOpen(false); }} className="flex w-full cursor-pointer items-center gap-2 rounded-md px-3 py-1.5 text-sm text-slate-700 transition hover:bg-slate-100">
                          <span className="flex-1 text-left">{role}</span>
                          {roleFilter === role && <Check className="h-3.5 w-3.5 text-teal-600" />}
                        </button>
                      ))}
                  </PopoverContent>
                </Popover>
                {(searchTerm || roleFilter !== "All") && (
                  <button
                    type="button"
                    onClick={() => { setSearchTerm(""); setRoleFilter("All"); }}
                    className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors border border-rose-100"
                  >
                    <FilterX size={14} />
                    Clear
                  </button>
                )}
              </>
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
      </section>

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
