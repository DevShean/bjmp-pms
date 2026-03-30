"use client";

import Image from "next/image";

import { useEffect, useState } from "react";
import VisitorHeader from "../../components/VisitorHeader";
import VisitorSidebar from "../../components/VisitorSidebar";
import PdlCombobox from "../../components/PdlCombobox";
import QrEntryButton from "../../components/QrEntryButton";
import { supabase } from "../../../lib/supabase/client";
import { toast } from "sonner";
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
  CheckCircle2,
  CheckCircle,
  Clock,
  SendHorizonal,
  Loader2,
  ShieldCheck,
  KeyRound,
  RefreshCw,
} from "lucide-react";

// ─── Session helper ───────────────────────────────────────────────────────────

function getSession(): { userId: number; email: string } | null {
  try {
    const cookie = document.cookie
      .split("; ")
      .find((row) => row.startsWith("bjmp_session="));
    if (!cookie) return null;
    const raw = decodeURIComponent(cookie.split("=")[1]);
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────

type VisitorRow = {
  visitor_id: number;
  inmate_id: number | null;
};

type ProfileRow = {
  firstname: string | null;
  lastname: string | null;
  contact_number: string | null;
  address: string | null;
  is_email_verified?: boolean;
  photo_url: string | null;
};

type LinkedPdl = {
  inmate_id: number;
  first_name: string | null;
  last_name: string | null;
  cell_block: string | null;
  photo_path: string | null;
};

export default function ProfilePage() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedPdlId, setSelectedPdlId] = useState("");
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [isSendingRequest, setIsSendingRequest] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // PDL Guardian linked/pending statuses
  const [linkedPdl, setLinkedPdl] = useState<LinkedPdl | null>(null);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const [pendingReqPdlName, setPendingReqPdlName] = useState<string | null>(null);

  // Email verification OTP flow
  const [verifyStep, setVerifyStep] = useState<"idle" | "sending" | "input" | "verifying">("idle");
  const [otpCode, setOtpCode] = useState("");

  // Session / visitor data
  const [sessionEmail, setSessionEmail] = useState("visitor@bjmp.portal");
  const [sessionUserId, setSessionUserId] = useState<number | null>(null);
  const [visitorId, setVisitorId] = useState<number | null>(null);
  const [profile, setProfile] = useState<ProfileRow>({
    firstname: null,
    lastname: null,
    contact_number: null,
    address: null,
    photo_url: null,
  });

  // Controlled edit form — mirrors profile but tracks unsaved changes
  const [editForm, setEditForm] = useState<ProfileRow>({
    firstname: null,
    lastname: null,
    contact_number: null,
    address: null,
    photo_url: null,
  });

  // ── Load visitor data from session ──
  useEffect(() => {
    const session = getSession();
    if (!session) return;

    setSessionEmail(session.email);
    setSessionUserId(session.userId);

    (async () => {
      // 1. Get visitor row
      const { data: visitorData } = await supabase
        .from("visitors")
        .select("visitor_id, inmate_id")
        .eq("user_id", session.userId)
        .maybeSingle<VisitorRow>();

      if (visitorData) {
        setVisitorId(visitorData.visitor_id);

        if (visitorData.inmate_id) {
          // Fetch the approved linked PDL
          const { data: pdlData } = await supabase
            .from("inmates")
            .select("inmate_id, first_name, last_name, cell_block, photo_path")
            .eq("inmate_id", visitorData.inmate_id)
            .maybeSingle();

          if (pdlData) {
            setLinkedPdl(pdlData);
          }
        } else {
          // Check if they have a pending request
          const { data: reqData } = await supabase
            .from("guardian_requests")
            .select(`
              request_id,
              status,
              inmates (
                first_name,
                last_name
              )
            `)
            .eq("visitor_id", visitorData.visitor_id)
            .eq("status", "Pending")
            .maybeSingle();

          if (reqData) {
            setHasPendingRequest(true);
            const rData = reqData as unknown as { inmates: { first_name: string | null; last_name: string | null } | null };
            if (rData.inmates) {
              setPendingReqPdlName(`${rData.inmates.first_name || ""} ${rData.inmates.last_name || ""}`.trim());
            }
          }
        }
      }

      // 2. Get profile row
      const { data: profileData } = await supabase
        .from("profiles")
        .select("firstname, lastname, contact_number, address, is_email_verified, photo_url")
        .eq("user_id", session.userId)
        .maybeSingle<ProfileRow>();

      if (profileData) {
        setProfile(profileData);
        setEditForm(profileData); // sync controlled form
        if (profileData.is_email_verified) setIsEmailVerified(true);
      }
    })();
  }, []);

  const displayName =
    profile.firstname || profile.lastname
      ? `${profile.firstname ?? ""} ${profile.lastname ?? ""}`.trim()
      : "Visitor Account";

  const initials = displayName
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "VA";

  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // ── Upload Profile Photo ──
  const handleUploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !sessionUserId) return;
    const file = e.target.files[0];

    try {
      setIsUploadingPhoto(true);
      const fileExt = file.name.split(".").pop();
      const fileName = `${sessionUserId}-${Date.now()}.${fileExt}`;
      const filePath = `visitors/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("profiles")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Clean up the old photo from storage to prevent orphaned files
      if (profile.photo_url && profile.photo_url.includes("profiles")) {
        try {
            let oldPath = "";
            if (profile.photo_url.startsWith("http")) {
                const url = new URL(profile.photo_url);
                const pathSegments = url.pathname.split("profiles/");
                if (pathSegments.length > 1) {
                    oldPath = decodeURIComponent(pathSegments[1]);
                }
            }

            if (oldPath) {
                await supabase.storage.from("profiles").remove([oldPath]);
            }
        } catch (e) {
            console.error("Failed to parse or delete old photo:", e);
        }
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("profiles")
        .getPublicUrl(filePath);

      // Update profiles table
      const { error: dbError } = await supabase
        .from("profiles")
        .update({ photo_url: publicUrl })
        .eq("user_id", sessionUserId);

      if (dbError) throw dbError;

      setProfile((prev) => ({ ...prev, photo_url: publicUrl }));
      setEditForm((prev) => ({ ...prev, photo_url: publicUrl }));
      toast.success("Profile photo updated!");
    } catch (error) {
      console.error("Photo upload error:", error);
      toast.error("Failed to upload photo. Please try again.");
    } finally {
      setIsUploadingPhoto(false);
      e.target.value = ""; // reset input
    }
  };

  // ── Email verification — send code ──
  const handleSendCode = async () => {
    if (!sessionUserId || !sessionEmail) return;
    try {
      setVerifyStep("sending");
      const res = await fetch("/api/auth/send-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: sessionUserId, email: sessionEmail }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to send code.");
      toast.success(`A 6-digit code was sent to ${sessionEmail}.`);
      setVerifyStep("input");
      setOtpCode("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send verification email.");
      setVerifyStep("idle");
    }
  };

  // ── Email verification — check code ──
  const handleVerifyCode = async () => {
    if (!sessionUserId || otpCode.length !== 6) return;
    try {
      setVerifyStep("verifying");
      const res = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: sessionUserId, code: otpCode }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Verification failed.");
      setIsEmailVerified(true);
      setVerifyStep("idle");
      toast.success("Email verified successfully!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Invalid or expired code.");
      setVerifyStep("input"); // let them retry
    }
  };

  // ── Save profile ──
  const handleSaveProfile = async () => {
    if (!sessionUserId) {
      toast.error("Session expired. Please sign in again.");
      return;
    }
    try {
      setIsSavingProfile(true);
      const { error } = await supabase
        .from("profiles")
        .update({
          firstname: editForm.firstname || null,
          lastname: editForm.lastname || null,
          contact_number: editForm.contact_number || null,
          address: editForm.address || null,
        })
        .eq("user_id", sessionUserId);

      if (error) throw error;

      // Commit changes to the saved profile state
      setProfile({ ...editForm });
      setIsEditing(false);
      toast.success("Profile updated successfully!");
    } catch (err) {
      console.error("Profile save error:", err);
      toast.error("Failed to save profile. Please try again.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  // ── Cancel edit — reset form to last saved values ──
  const handleCancelEdit = () => {
    setEditForm({ ...profile });
    setIsEditing(false);
  };

  // ── Send PDL guardian request ──
  const handleSendRequest = async () => {
    if (!selectedPdlId) return;
    if (!visitorId) {
      toast.error("Could not find your visitor profile. Please log out and sign in again.");
      return;
    }

    try {
      setIsSendingRequest(true);

      // 1. Check for existing pending request for same visitor + inmate
      const { data: existingRequest } = await supabase
        .from("guardian_requests")
        .select("request_id, status")
        .eq("visitor_id", visitorId)
        .eq("inmate_id", parseInt(selectedPdlId, 10))
        .maybeSingle();

      if (existingRequest) {
        if (existingRequest.status === "Pending") {
          toast.warning("You already have a pending guardian request for this PDL.");
          return;
        }
        if (existingRequest.status === "Approved") {
          toast.info("You are already an approved guardian for this PDL.");
          return;
        }
      }

      // 2. Insert guardian request
      const { error: requestError } = await supabase.from("guardian_requests").insert({
        visitor_id: visitorId,
        inmate_id: parseInt(selectedPdlId, 10),
        status: "Pending",
      });

      if (requestError) throw requestError;

      // 3. Get all admin user IDs (role_id = 1)
      const { data: admins } = await supabase
        .from("users")
        .select("user_id")
        .eq("role_id", 1);

      // 4. Send a notification to each admin
      if (admins && admins.length > 0) {
        const notifications = admins.map((admin) => ({
          user_id: admin.user_id,
          title: "New PDL Guardian Request",
          message: `${displayName} (${sessionEmail}) has requested to be a guardian for PDL #${selectedPdlId}. Please review the request.`,
          type: "guardian_request",
          is_read: false,
        }));

        const { error: notifError } = await supabase.from("notifications").insert(notifications);
        if (notifError) {
          console.error("Notification insert failed:", notifError);
        }
      }

      toast.success("Guardian request sent successfully! An administrator will review it shortly.");
      setHasPendingRequest(true);
      setPendingReqPdlName(`PDL #${selectedPdlId}`);
      setSelectedPdlId(""); // Reset selection after successful request
    } catch (err) {
      console.error("Guardian request error:", err);
      toast.error("Failed to send guardian request. Please try again.");
    } finally {
      setIsSendingRequest(false);
    }
  };

  const profileStats = [
    { label: "Completed Visits", value: "08", icon: CheckCircle, color: "emerald", trend: "+2 from last month" },
    { label: "Upcoming Visits", value: "02", icon: Calendar, color: "blue", trend: "Next: Mar 25, 2026" },
    { label: "Pending Requests", value: "01", icon: Clock, color: "amber", trend: "Awaiting approval" },
  ];

  const getStatColorClasses = (color: string) => {
    const colors = {
      emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
      blue: "bg-blue-50 text-blue-700 border-blue-200",
      amber: "bg-amber-50 text-amber-700 border-amber-200",
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <div className="flex min-h-screen w-full bg-linear-to-br from-slate-50 via-white to-blue-50/30">
      <VisitorSidebar
        sessionUser={{ name: displayName, email: sessionEmail }}
        isCollapsed={isSidebarCollapsed}
      />

      <div className="flex flex-1 flex-col">
        <VisitorHeader
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          sessionUser={{ name: displayName, email: sessionEmail }}
        />

        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">

            {/* ── Hero Section ── */}
            <section className="group relative overflow-hidden rounded-3xl bg-linear-to-br from-[#0a1e47] via-[#0f2f6a] to-[#1e4b8f] p-1 shadow-2xl">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.14),transparent_35%),radial-gradient(circle_at_80%_10%,rgba(255,255,255,0.08),transparent_30%),radial-gradient(circle_at_70%_80%,rgba(255,255,255,0.12),transparent_38%)] opacity-60" />
              <div className="relative rounded-2xl bg-white/5 backdrop-blur-sm p-6 md:p-8">
                <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                  <div className="flex items-center gap-5">
                    {/* Avatar */}
                    <div className="relative">
                      <div className="relative overflow-hidden flex h-24 w-24 items-center justify-center rounded-2xl bg-linear-to-br from-white/20 to-white/5 text-3xl font-semibold text-white ring-4 ring-white/20 backdrop-blur-sm md:h-28 md:w-28 md:text-4xl">
                        {profile.photo_url ? (
                          <Image src={profile.photo_url} alt="Profile" fill className="object-cover" />
                        ) : (
                          initials
                        )}
                        {isUploadingPhoto && (
                           <div className="absolute inset-x-0 bottom-0 bg-black/50 p-2 flex justify-center backdrop-blur-md">
                             <Loader2 className="h-5 w-5 text-white animate-spin" />
                           </div>
                        )}
                      </div>
                      <label 
                         className={`cursor-pointer absolute -bottom-2 -right-2 rounded-full bg-white p-2 text-[#0f2f6a] shadow-lg transition-all hover:scale-110 hover:bg-blue-50 ${isUploadingPhoto ? 'opacity-50 pointer-events-none' : ''}`}
                      >
                        <Camera className="h-4 w-4" />
                        <input 
                           type="file" 
                           className="hidden" 
                           accept="image/*" 
                           onChange={handleUploadPhoto}
                           disabled={isUploadingPhoto} 
                        />
                      </label>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center gap-3">
                        <h1 className="font-lexend text-3xl font-semibold text-white md:text-4xl">
                          {displayName}
                        </h1>
                        <span className="rounded-full bg-emerald-400/20 px-3 py-1 text-xs font-medium text-emerald-200 backdrop-blur-sm">
                          Verified
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-sm text-blue-100">
                        <span className="flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5" />
                          Visitor Portal
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5" />
                          Member since 2026
                        </span>
                      </div>

                      <div className="pt-2 max-w-56">
                        <QrEntryButton
                          visitorName={displayName}
                          profileId={visitorId ? `VIS-${visitorId}` : "VIS-???"}
                          pdlId={selectedPdlId || undefined}
                          disabled={!selectedPdlId}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={isEditing ? handleCancelEdit : () => setIsEditing(true)}
                      className="cursor-pointer inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-5 py-2.5 text-sm font-medium text-white backdrop-blur-sm transition-all hover:bg-white/20 hover:shadow-lg"
                    >
                      <Edit2 className="h-4 w-4" />
                      {isEditing ? "Cancel" : "Edit Profile"}
                    </button>
                    {isEditing && (
                      <button
                        onClick={handleSaveProfile}
                        disabled={isSavingProfile}
                        className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-[#0f2f6a] shadow-lg transition-all hover:bg-blue-50 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {isSavingProfile ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4" />
                        )}
                        {isSavingProfile ? "Saving…" : "Save Changes"}
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

            {/* ── Main Content Grid ── */}
            <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
              {/* Left — Personal Information */}
              <div className="space-y-6">
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
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-700 outline-none transition-all focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:opacity-70"
                        value={editForm.firstname ?? ""}
                        onChange={(e) => setEditForm((f) => ({ ...f, firstname: e.target.value }))}
                        disabled={!isEditing}
                        placeholder="First name"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-500">
                        <User className="h-3.5 w-3.5" />
                        Last Name
                      </label>
                      <input
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-700 outline-none transition-all focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:opacity-70"
                        value={editForm.lastname ?? ""}
                        onChange={(e) => setEditForm((f) => ({ ...f, lastname: e.target.value }))}
                        disabled={!isEditing}
                        placeholder="Last name"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-500">
                        <Mail className="h-3.5 w-3.5" />
                        Email Address
                      </label>
                      <input
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-700 outline-none transition-all focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:opacity-70"
                        value={sessionEmail}
                        readOnly
                        disabled
                      />
                      {/* ── Email verification block ── */}
                      {isEmailVerified ? (
                        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2">
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                          <span className="text-xs font-medium text-emerald-700">Email verified</span>
                        </div>
                      ) : (
                        <div className="space-y-2 rounded-xl border border-amber-200 bg-amber-50/60 p-3">
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1.5 text-xs font-medium text-amber-700">
                              <ShieldCheck className="h-3.5 w-3.5" />
                              Email not verified
                            </span>
                            {verifyStep === "idle" && (
                              <button
                                type="button"
                                onClick={handleSendCode}
                                className="cursor-pointer rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 transition-all hover:bg-blue-100"
                              >
                                Send Code
                              </button>
                            )}
                            {verifyStep === "sending" && (
                              <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Sending…
                              </span>
                            )}
                          </div>

                          {/* OTP input step */}
                          {(verifyStep === "input" || verifyStep === "verifying") && (
                            <div className="space-y-2 pt-1">
                              <p className="text-xs text-slate-500">
                                Enter the 6-digit code sent to <strong>{sessionEmail}</strong>.
                              </p>
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  maxLength={6}
                                  value={otpCode}
                                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                                  placeholder="000000"
                                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-center font-mono text-lg font-semibold tracking-[0.35em] text-slate-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                                />
                                <button
                                  type="button"
                                  onClick={handleVerifyCode}
                                  disabled={otpCode.length !== 6 || verifyStep === "verifying"}
                                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-[#0f2f6a] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#1a3f7a] disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  {verifyStep === "verifying" ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <KeyRound className="h-3.5 w-3.5" />
                                  )}
                                  Verify
                                </button>
                              </div>
                              <button
                                type="button"
                                onClick={handleSendCode}
                                disabled={verifyStep === "verifying"}
                                className="inline-flex cursor-pointer items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition disabled:opacity-50"
                              >
                                <RefreshCw className="h-3 w-3" /> Resend code
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-500">
                        <Phone className="h-3.5 w-3.5" />
                        Contact Number
                      </label>
                      <input
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-700 outline-none transition-all focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:opacity-70"
                        value={editForm.contact_number ?? ""}
                        onChange={(e) => setEditForm((f) => ({ ...f, contact_number: e.target.value }))}
                        disabled={!isEditing}
                        placeholder="e.g. 0917 123 4567"
                      />
                    </div>
                    <div className="sm:col-span-2 space-y-2">
                      <label className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-500">
                        <MapPin className="h-3.5 w-3.5" />
                        Home Address
                      </label>
                      <input
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-700 outline-none transition-all focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:opacity-70"
                        value={editForm.address ?? ""}
                        onChange={(e) => setEditForm((f) => ({ ...f, address: e.target.value }))}
                        disabled={!isEditing}
                        placeholder="Home address"
                      />
                    </div>
                  </div>

                  {isEditing && (
                    <div className="mt-6 flex justify-end gap-3">
                      <button
                        onClick={handleCancelEdit}
                        disabled={isSavingProfile}
                        className="cursor-pointer rounded-xl border border-slate-300 bg-white px-6 py-2.5 text-sm font-medium text-slate-600 transition-all hover:bg-slate-50 hover:shadow-md disabled:opacity-60"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveProfile}
                        disabled={isSavingProfile}
                        className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-[#0f2f6a] to-[#1e4b8f] px-6 py-2.5 text-sm font-medium text-white shadow-lg transition-all hover:from-[#1a3f7a] hover:to-[#2a5ca5] hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {isSavingProfile ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4" />
                        )}
                        {isSavingProfile ? "Saving…" : "Save Changes"}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Right — PDL Guardian */}
              <div className="space-y-6">
                <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-xl shadow-slate-200/50 backdrop-blur-sm transition-all hover:shadow-2xl flex flex-col items-center">
                  {linkedPdl ? (
                    <div className="w-full flex flex-col items-center text-center">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
                          <CheckCircle className="h-5 w-5" />
                        </div>
                        <h3 className="font-lexend text-lg font-semibold text-slate-800">Approved Guardian</h3>
                      </div>
                      
                      {/* ID Card Display */}
                      <div className="relative mt-2 w-full max-w-sm rounded-[1.5rem] border border-slate-200 bg-white shadow-sm overflow-hidden text-left hover:shadow-md transition-shadow">
                        <div className="h-16 w-full bg-linear-to-r from-emerald-600 to-teal-500 relative">
                           <div className="absolute inset-x-0 bottom-0 h-4 bg-white/20 blur-sm rounded-t-full" />
                        </div>
                        <div className="px-6 pb-6 relative -mt-8 flex flex-col gap-4">
                           <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border-4 border-white shadow-sm bg-slate-100">
                             {linkedPdl.photo_path ? (
                               <Image
                                  src={linkedPdl.photo_path}
                                  alt="PDL Photo"
                                  fill
                                  className="object-cover"
                                />
                             ) : (
                                <div className="flex h-full w-full items-center justify-center text-slate-300">
                                   <User className="h-8 w-8" />
                                </div>
                             )}
                           </div>
                           <div>
                             <h4 className="font-lexend text-lg font-bold text-slate-800 leading-tight">
                                {`${linkedPdl.first_name || ""} ${linkedPdl.last_name || ""}`.trim() || `PDL #${linkedPdl.inmate_id}`}
                             </h4>
                             <p className="text-sm font-medium text-emerald-600 mt-0.5">PDL #{linkedPdl.inmate_id}</p>
                           </div>
                           <div className="grid grid-cols-2 gap-3 mt-2 border-t border-slate-100 pt-3">
                              <div>
                                 <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Cell Block</p>
                                 <p className="font-medium text-slate-700 text-sm mt-0.5">{linkedPdl.cell_block || "Unassigned"}</p>
                              </div>
                              <div>
                                 <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Status</p>
                                 <div className="inline-flex mt-0.5 items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                                    Active Guard
                                 </div>
                              </div>
                           </div>
                        </div>
                      </div>
                    </div>
                  ) : hasPendingRequest ? (
                    <div className="w-full text-center py-4">
                      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-amber-500">
                        <Clock className="h-7 w-7" />
                      </div>
                      <h3 className="font-lexend text-lg font-semibold text-slate-800">Request Pending</h3>
                      <p className="mt-2 text-sm text-slate-500 px-4">
                        Your request to be the guardian of <strong>{pendingReqPdlName || "the selected PDL"}</strong> is currently under review by the administration.
                      </p>
                      <div className="mt-6 inline-block rounded-xl bg-slate-50 border border-slate-100 px-4 py-3 text-sm text-slate-600">
                        You will be notified once a decision has been made.
                      </div>
                    </div>
                  ) : (
                    <div className="w-full">
                      <div className="flex items-center gap-2">
                        <div className="rounded-lg bg-rose-50 p-2 text-rose-600">
                          <AlertCircle className="h-5 w-5" />
                        </div>
                        <h3 className="font-lexend text-lg font-semibold text-slate-800">PDL Guardian</h3>
                      </div>
                      <p className="mt-2 text-sm text-slate-500">
                        Request to be a guardian for a PDL. An administrator will review and approve your request.
                      </p>

                      <div className="mt-4">
                        <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-500">
                          Select PDL
                        </label>
                        <PdlCombobox
                          value={selectedPdlId}
                          onValueChange={setSelectedPdlId}
                          excludeType="guardian"
                        />
                      </div>

                      {selectedPdlId && (
                        <div className="mt-4 rounded-2xl bg-linear-to-br from-rose-50 to-white p-4 border border-rose-100">
                          <p className="text-xs font-medium uppercase tracking-wide text-rose-600">Selected PDL</p>
                          <p className="mt-1 font-semibold text-slate-800">PDL #{selectedPdlId}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            Your request will be sent to the administration for review.
                          </p>
                        </div>
                      )}

                      <div className="mt-4 space-y-3">
                        {!isEmailVerified && (
                          <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                            <p className="text-xs text-amber-700">
                              You must verify your email above before sending a guardian request.
                            </p>
                          </div>
                        )}
                        <button
                          onClick={handleSendRequest}
                          disabled={!selectedPdlId || isSendingRequest || !isEmailVerified}
                          className="w-full inline-flex items-center justify-center gap-2 rounded-xl border-2 border-rose-200 bg-rose-50/50 px-4 py-3 text-sm font-medium text-rose-700 transition-all enabled:cursor-pointer hover:border-rose-300 hover:bg-rose-100/80 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isSendingRequest ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <SendHorizonal className="h-4 w-4" />
                          )}
                          {isSendingRequest ? "Sending Request…" : "Send Request"}
                        </button>
                        <p className="text-center text-xs text-slate-400">
                          Requests are subject to facility approval and verification.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}