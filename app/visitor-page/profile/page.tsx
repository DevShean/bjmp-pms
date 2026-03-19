"use client";

import { useState } from "react";
import VisitorHeader from "../../components/VisitorHeader";
import VisitorSidebar from "../../components/VisitorSidebar";
import PdlCombobox from "../../components/PdlCombobox";
import QrEntryButton from "../../components/QrEntryButton";
import { 
  Camera, 
  Edit2, 
  Save, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar,
  User,
  AlertCircle,
  CheckCircle,
  Clock
} from "lucide-react";

export default function ProfilePage() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedPdlId, setSelectedPdlId] = useState("");
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  
  const profileStats = [
    { label: "Completed Visits", value: "08", icon: CheckCircle, color: "emerald", trend: "+2 from last month" },
    { label: "Upcoming Visits", value: "02", icon: Calendar, color: "blue", trend: "Next: Mar 25, 2026" },
    { label: "Pending Requests", value: "01", icon: Clock, color: "amber", trend: "Awaiting approval" },
  ];

  const getStatColorClasses = (color: string) => {
    const colors = {
      emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
      blue: "bg-blue-50 text-blue-700 border-blue-200",
      amber: "bg-amber-50 text-amber-700 border-amber-200"
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <div className="flex min-h-screen w-full bg-linear-to-br from-slate-50 via-white to-blue-50/30">
      <VisitorSidebar
        sessionUser={{
          name: "Visitor Account",
          email: "visitor@bjmp.portal",
        }}
        isCollapsed={isSidebarCollapsed}
      />
      
      <div className="flex flex-1 flex-col">
        <VisitorHeader
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          sessionUser={{
            name: "Visitor Account",
            email: "visitor@bjmp.portal",
          }}
        />
        
        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
            {/* Hero Section with Glassmorphism */}
            <section className="group relative overflow-hidden rounded-3xl bg-linear-to-br from-[#0a1e47] via-[#0f2f6a] to-[#1e4b8f] p-1 shadow-2xl">
              {/* Animated background pattern */}
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.14),transparent_35%),radial-gradient(circle_at_80%_10%,rgba(255,255,255,0.08),transparent_30%),radial-gradient(circle_at_70%_80%,rgba(255,255,255,0.12),transparent_38%)] opacity-60" />
              <div className="relative rounded-2xl bg-white/5 backdrop-blur-sm p-6 md:p-8">
                <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                  <div className="flex items-center gap-5">
                    {/* Avatar with upload overlay */}
                    <div className="relative">
                      <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-linear-to-br from-white/20 to-white/5 text-3xl font-semibold text-white ring-4 ring-white/20 backdrop-blur-sm md:h-28 md:w-28 md:text-4xl">
                        VA
                      </div>
                      <button className="cursor-pointer absolute -bottom-2 -right-2 rounded-full bg-white p-2 text-[#0f2f6a] shadow-lg transition-all hover:scale-110 hover:bg-blue-50">
                        <Camera className="h-4 w-4" />
                      </button>
                    </div>
                    
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-3">
                        <h1 className="font-lexend text-3xl font-semibold text-white md:text-4xl">
                          Visitor Account
                        </h1>
                        <span className="rounded-full bg-emerald-400/20 px-3 py-1 text-xs font-medium text-emerald-200 backdrop-blur-sm">
                          Verified
                        </span>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm text-blue-100">
                        <span className="flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5" />
                          Profile ID: VIS-2026-0041
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5" />
                          Member since Jan 2026
                        </span>
                      </div>

            <div className="pt-2 max-w-56">
            <QrEntryButton
              visitorName="Visitor Account"
              profileId="VIS-2026-0041"
              pdlId={selectedPdlId || undefined}
              disabled={!selectedPdlId}
            />
            </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={() => setIsEditing(!isEditing)}
                      className="cursor-pointer inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-5 py-2.5 text-sm font-medium text-white backdrop-blur-sm transition-all hover:bg-white/20 hover:shadow-lg"
                    >
                      <Edit2 className="h-4 w-4" />
                      {isEditing ? "Cancel Editing" : "Edit Profile"}
                    </button>
                    {isEditing && (
                      <button className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-[#0f2f6a] shadow-lg transition-all hover:bg-blue-50 hover:shadow-xl">
                        <Save className="h-4 w-4" />
                        Save Changes
                      </button>
                    )}
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="mt-8 grid gap-4 sm:grid-cols-3">
                  {profileStats.map((item) => {
                    const Icon = item.icon;
                    return (
                      <div
                        key={item.label}
                        className="group/stat relative overflow-hidden rounded-2xl border border-white/20 bg-white/10 p-5 backdrop-blur-sm transition-all hover:bg-white/15 hover:shadow-xl"
                      >
                        <div className="absolute right-0 top-0 h-20 w-20 translate-x-6 -translate-y-6 rounded-full bg-white/5" />
                        <div className="relative flex items-start justify-between">
                          <div>
                            <p className="text-3xl font-bold text-white md:text-4xl">{item.value}</p>
                            <p className="mt-1 text-sm font-medium text-blue-100">{item.label}</p>
                            <p className="mt-2 text-xs text-blue-200/80">{item.trend}</p>
                          </div>
                          <div className={`rounded-xl p-3 ${getStatColorClasses(item.color)} bg-white/20 backdrop-blur-sm`}>
                            <Icon className="h-5 w-5" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* Main Content Grid */}
            <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
              {/* Left Column - Personal Information */}
              <div className="space-y-6">
                {/* Personal Information Card */}
                <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-xl shadow-slate-200/50 backdrop-blur-sm transition-all hover:shadow-2xl md:p-7">
                  <div className="mb-6 flex items-center justify-between">
                    <div>
                      <h2 className="font-lexend text-xl font-semibold text-slate-800">Personal Information</h2>
                      <p className="mt-1 text-sm text-slate-500">Manage your personal details and contact information</p>
                    </div>
                    <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 ring-1 ring-blue-700/10">
                      Primary Details
                    </span>
                  </div>
                  
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-500">
                        <User className="h-3.5 w-3.5" />
                        First Name
                      </label>
                      <input 
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-700 outline-none transition-all focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100" 
                        defaultValue="Visitor"
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-500">
                        <User className="h-3.5 w-3.5" />
                        Last Name
                      </label>
                      <input 
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-700 outline-none transition-all focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100" 
                        defaultValue="Account"
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-500">
                        <Mail className="h-3.5 w-3.5" />
                        Email Address
                      </label>
                      <input 
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-700 outline-none transition-all focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100" 
                        defaultValue="visitor@bjmp.portal"
                        disabled={!isEditing}
                      />
                      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2">
                        <span
                          className={`text-xs font-medium ${
                            isEmailVerified ? "text-emerald-700" : "text-amber-700"
                          }`}
                        >
                          {isEmailVerified ? "Email verified" : "Email not verified"}
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsEmailVerified(true)}
                          disabled={isEmailVerified}
                          className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 transition-all hover:bg-blue-100 disabled:cursor-not-allowed disabled:border-emerald-200 disabled:bg-emerald-50 disabled:text-emerald-700"
                        >
                          {isEmailVerified ? "Verified" : "Verify Email"}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-500">
                        <Phone className="h-3.5 w-3.5" />
                        Contact Number
                      </label>
                      <input 
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-700 outline-none transition-all focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100" 
                        defaultValue="0917 123 4567"
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="sm:col-span-2 space-y-2">
                      <label className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-500">
                        <MapPin className="h-3.5 w-3.5" />
                        Home Address
                      </label>
                      <input 
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-700 outline-none transition-all focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100" 
                        defaultValue="Barangay San Jose, Quezon City"
                        disabled={!isEditing}
                      />
                    </div>
                  </div>
                  
                  {isEditing && (
                    <div className="mt-6 flex justify-end gap-3">
                      <button className="rounded-xl border border-slate-300 bg-white px-6 py-2.5 text-sm font-medium text-slate-600 transition-all hover:bg-slate-50 hover:shadow-md">
                        Cancel
                      </button>
                      <button className="rounded-xl bg-linear-to-r from-[#0f2f6a] to-[#1e4b8f] px-6 py-2.5 text-sm font-medium text-white shadow-lg transition-all hover:from-[#1a3f7a] hover:to-[#2a5ca5] hover:shadow-xl">
                        Save Changes
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* PDL Guardian */}
                <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-xl shadow-slate-200/50 backdrop-blur-sm transition-all hover:shadow-2xl">
                  <div className="flex items-center gap-2">
                    <div className="rounded-lg bg-rose-50 p-2 text-rose-600">
                      <AlertCircle className="h-5 w-5" />
                    </div>
                    <h3 className="font-lexend text-lg font-semibold text-slate-800">PDL Guardian</h3>
                  </div>
                  <p className="mt-2 text-sm text-slate-500">Request a guardian profile to support approvals and visitation coordination.</p>

                  <div className="mt-4">
                    <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-500">
                      Select PDL
                    </label>
                    <PdlCombobox value={selectedPdlId} onValueChange={setSelectedPdlId} />
                  </div>
                  
                  <div className="mt-4 rounded-2xl bg-linear-to-br from-rose-50 to-white p-5 border border-rose-100">
                    <div className="space-y-3">
                      <div>
                        <p className="font-semibold text-slate-800">
                          {selectedPdlId ? `Selected PDL: ${selectedPdlId}` : "No PDL Selected"}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 space-y-3">
                    <button
                      disabled={!selectedPdlId}
                      className="w-full rounded-xl border-2 border-rose-200 bg-rose-50/50 px-4 py-3 text-sm font-medium text-rose-700 transition-all enabled:cursor-pointer hover:border-rose-300 hover:bg-rose-100/80 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Send Request
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}