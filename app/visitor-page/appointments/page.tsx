"use client";

import { useEffect, useState } from "react";
import VisitorHeader from "../../components/VisitorHeader";
import VisitorSidebar from "../../components/VisitorSidebar";
import PdlCombobox from "../../components/PdlCombobox";
import { supabase } from "../../../lib/supabase/client";
import { toast } from "sonner";
import { Loader2, CalendarHeart, Clock, Users, Send } from "lucide-react";

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

export default function AppointmentPage() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  const [sessionUser, setSessionUser] = useState<{ userId: number; email: string; name?: string } | null>(null);
  const [visitorId, setVisitorId] = useState<number | null>(null);
  const [visitorName, setVisitorName] = useState<string>("Visitor");

  const [selectedPdlId, setSelectedPdlId] = useState("");
  const [visitType, setVisitType] = useState("Visit to the Inmate");
  const [relationship, setRelationship] = useState("Family");
  const [scheduledDate, setScheduledDate] = useState("");
  const [isGuardian, setIsGuardian] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Enum mappings based on database
  const VISIT_TYPES = ["Visit to the Inmate", "Conjugal Visit", "Paduhol Visit"];
  const RELATIONSHIPS = ["Family", "Friend", "Legal Representative", "Doctor", "Others"];

  useEffect(() => {
    const session = getSession();
    if (!session) return;
    
    const loadSession = async () => {
      // 1. Get profile name
      const { data: profile } = await supabase
        .from("profiles")
        .select("firstname, lastname")
        .eq("user_id", session.userId)
        .maybeSingle();

      const name = profile ? `${profile.firstname || ""} ${profile.lastname || ""}`.trim() : "Visitor";
      setSessionUser({ ...session, name });
      setVisitorName(name);

      // 2. Get visitor record
      const { data: visitor } = await supabase
        .from("visitors")
        .select("visitor_id, inmate_id")
        .eq("user_id", session.userId)
        .maybeSingle();

      if (visitor) {
        setVisitorId(visitor.visitor_id);
      }
    };
    loadSession();
  }, []);

  // Check if current user is the guardian for the selected PDL
  useEffect(() => {
    if (!selectedPdlId || !sessionUser) {
      setIsGuardian(false);
      return;
    }

    const checkGuardian = async () => {
      const { data } = await supabase
        .from("visitors")
        .select("user_id")
        .eq("inmate_id", selectedPdlId)
        .maybeSingle();

      setIsGuardian(!!data && data.user_id === sessionUser.userId);
    };
    checkGuardian();
  }, [selectedPdlId, sessionUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPdlId || !scheduledDate || !visitorId || !sessionUser) {
      toast.error("Please fill out all required fields.");
      return;
    }

    try {
      setIsSubmitting(true);

      // 1. Check maximum 5 visits per day limit for this inmate
      const startOfDay = new Date(scheduledDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(scheduledDate);
      endOfDay.setHours(23, 59, 59, 999);

      const { count, error: countError } = await supabase
        .from("visitations")
        .select("*", { count: "exact", head: true })
        .eq("inmate_id", selectedPdlId)
        .gte("scheduled_date", startOfDay.toISOString())
        .lte("scheduled_date", endOfDay.toISOString())
        .neq("status", "Denied")
        .neq("status", "Cancelled");

      if (countError) throw countError;

      if (count !== null && count >= 5) {
        toast.error("This PDL has already reached the maximum of 5 visits for the selected date.");
        setIsSubmitting(false);
        return;
      }

      // 2. Determine if PDL has another Guardian
      const { data: guardianVisitor } = await supabase
        .from("visitors")
        .select("user_id")
        .eq("inmate_id", selectedPdlId)
        .maybeSingle();

      const needsGuardianApproval = guardianVisitor && guardianVisitor.user_id !== sessionUser.userId;
      let finalNotesJson = null;
      let generatedToken = null;

      // Ensure Date is string format
      const isoDate = new Date(scheduledDate).toISOString();

      if (needsGuardianApproval) {
        // Generate pseudo-token and json
        generatedToken = Math.random().toString(36).substring(2) + Date.now().toString(36);
        finalNotesJson = JSON.stringify({ pending_guardian_approval: true, token: generatedToken });
      }

      // 3. Insert Visitation Row
      const { data: newVisit, error: insertError } = await supabase
        .from("visitations")
        .insert({
          inmate_id: selectedPdlId,
          visitor_id: visitorId,
          visit_type: visitType,
          scheduled_date: isoDate,
          notes: finalNotesJson,
          relationship: isGuardian ? "Guardian" : relationship,
        })
        .select("visit_id")
        .single();

      if (insertError) throw insertError;

      // 4. Send Approval Email to Guardian OR Notify Admins directly
      if (needsGuardianApproval && guardianVisitor && generatedToken) {
        // Fetch guardian info
        const { data: guardianProfile } = await supabase
          .from("profiles")
          .select("firstname, lastname")
          .eq("user_id", guardianVisitor.user_id)
          .maybeSingle();
        
        const { data: guardianUser } = await supabase
          .from("users")
          .select("email")
          .eq("user_id", guardianVisitor.user_id)
          .single();

        const { data: inmate } = await supabase
          .from("inmates")
          .select("first_name, last_name")
          .eq("inmate_id", selectedPdlId)
          .single();

        await fetch("/api/visitations/request-guardian-approval", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            visitId: newVisit.visit_id,
            token: generatedToken,
            guardianEmail: guardianUser?.email,
            guardianName: guardianProfile ? `${guardianProfile.firstname} ${guardianProfile.lastname}` : "Guardian",
            visitorName: visitorName,
            inmateName: inmate ? `${inmate.first_name} ${inmate.last_name}` : "PDL",
            visitDate: isoDate,
          }),
        });

        toast.success("Request sent to the PDL Guardian for approval!");
      } else {
        // I am the guardian, or there is no guardian. Directly notify Admins
        const { data: admins } = await supabase.from("users").select("user_id").eq("role_id", 1);
        if (admins && admins.length > 0) {
          const notifications = admins.map((admin) => ({
            user_id: admin.user_id,
            title: "New Visitation Request",
            message: `A new visitation request has been submitted by ${visitorName} for PDL #${selectedPdlId}.`,
            type: "visitation_request",
            is_read: false,
          }));
          await supabase.from("notifications").insert(notifications);
        }

        toast.success("Visitation request submitted to the administration successfully!");
      }

      // Reset Form fields
      setSelectedPdlId("");
      setScheduledDate("");
      setVisitType("Visit to the Inmate");
      setRelationship("Family");

    } catch (error) {
      console.error("Visitation scheduling error:", error);
      toast.error("Failed to submit visitation request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-linear-to-br from-slate-50 via-white to-blue-50/30">
      <VisitorSidebar
        sessionUser={{ name: sessionUser?.name || "Visitor Account", email: sessionUser?.email || "visitor@bjmp.portal" }}
        isCollapsed={isSidebarCollapsed}
      />

      <div className="flex flex-1 flex-col">
        <VisitorHeader
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          sessionUser={{ name: sessionUser?.name || "Visitor Account", email: sessionUser?.email || "visitor@bjmp.portal" }}
        />

        <main className="flex-1 px-4 py-8 md:px-8">
          <div className="mx-auto max-w-4xl space-y-6">
            <div className="group relative overflow-hidden rounded-3xl bg-linear-to-br from-[#0a1e47] via-[#0f2f6a] to-[#1e4b8f] p-8 shadow-2xl">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.14),transparent_35%),radial-gradient(circle_at_80%_10%,rgba(255,255,255,0.08),transparent_30%),radial-gradient(circle_at_70%_80%,rgba(255,255,255,0.12),transparent_38%)] opacity-60" />
              <div className="relative z-10">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20 backdrop-blur-sm mb-4">
                  <CalendarHeart className="h-6 w-6 text-blue-100" />
                </div>
                <h1 className="font-lexend text-3xl font-bold text-white md:text-4xl">Schedule a Visit</h1>
                <p className="mt-2 text-blue-100/90 text-sm md:text-base max-w-xl">
                  Submit a visitation request to the facility. An administrator will review your schedule.
                  Please note that an inmate allows a maximum of 5 visits per day.
                </p>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-xl shadow-slate-200/50 backdrop-blur-sm md:p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <Users className="h-4 w-4" />
                    Select PDL
                  </label>
                  <PdlCombobox
                    value={selectedPdlId}
                    onValueChange={setSelectedPdlId}
                    showAll
                    placeholder="Search for an inmate"
                  />
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Type of Visit
                    </label>
                    <select
                      value={visitType}
                      onChange={(e) => setVisitType(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition-all focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100 hover:border-blue-300 cursor-pointer"
                    >
                      {VISIT_TYPES.map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  {!isGuardian && (
                    <div className="space-y-2">
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Relationship to Inmate
                      </label>
                      <select
                        value={relationship}
                        onChange={(e) => setRelationship(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition-all focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100 hover:border-blue-300 cursor-pointer"
                      >
                        {RELATIONSHIPS.map((rel) => (
                          <option key={rel} value={rel}>{rel}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {isGuardian && (
                    <div className="space-y-2 flex flex-col justify-end">
                      <div className="h-[46px] w-full rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 flex items-center">
                        You are the Guardian of this PDL
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <Clock className="h-4 w-4" />
                    Scheduled Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    min={new Date().toISOString().slice(0, 16)}
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition-all focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100 cursor-text hover:border-blue-300"
                    required
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Select the proposed visit time during regular facility visiting hours.
                  </p>
                </div>

                <div className="pt-4 mt-8 border-t border-slate-100 flex items-center justify-end">
                  <button
                    type="submit"
                    disabled={isSubmitting || !selectedPdlId || !visitorId}
                    className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-linear-to-r from-[#0f2f6a] to-[#1e4b8f] px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-900/20 transition-all hover:scale-[1.02] hover:from-[#1a3f7a] hover:to-[#2a5ca5] active:scale-95 disabled:pointer-events-none disabled:opacity-70"
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    {isSubmitting ? "Submitting Request..." : "Submit Request"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
