"use client";

import { useEffect, useState } from "react";
import PdlCombobox from "../../components/PdlCombobox";
import { supabase } from "../../../lib/supabase/client";
import { toast } from "sonner";
import { Loader2, CalendarHeart, Clock, Users, Send, CalendarIcon, ChevronsUpDown, Check } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "../../../components/ui/popover";
import { Calendar } from "../../../components/ui/calendar";
import { format} from "date-fns";
import { cn } from "../../../lib/utils";
import { useVisitor } from "../layout";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from "../../../components/ui/dialog";
import { Button } from "../../../components/ui/button";
import { AlertCircle } from "lucide-react";

export default function AppointmentPage() {
  const { sessionUser, isLoading: isLayoutLoading } = useVisitor();
  const [visitorId, setVisitorId] = useState<number | null>(null);
  const [visitorName, setVisitorName] = useState<string>("Visitor");

  const [selectedPdlId, setSelectedPdlId] = useState("");
  const [visitType, setVisitType] = useState("Visit to the Inmate");
  const [relationship, setRelationship] = useState("Family");
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>();
  const [isGuardian, setIsGuardian] = useState(false);
  const [showGuardianDialog, setShowGuardianDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [visitTypeOpen, setVisitTypeOpen] = useState(false);
  const [relationshipOpen, setRelationshipOpen] = useState(false);

  // Enum mappings based on database
  const VISIT_TYPES = ["Visit to the Inmate", "Conjugal Visit", "Paduhol Visit"];
  const RELATIONSHIPS = ["Family", "Friend", "Legal Representative", "Doctor", "Others"];

  useEffect(() => {
    if (!sessionUser) return;
    
    const loadVisitorData = async () => {
      setVisitorName(sessionUser.name || "Visitor");

      // 2. Get visitor record
      const { data: visitor } = await supabase
        .from("visitors")
        .select("visitor_id, inmate_id")
        .eq("user_id", sessionUser.userId)
        .maybeSingle();

      if (visitor) {
        setVisitorId(visitor.visitor_id);
      }
    };
    
    if (!isLayoutLoading) {
      loadVisitorData();
    }
  }, [sessionUser, isLayoutLoading]);

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

      const isCurrentGuardian = !!data && data.user_id === sessionUser!.userId;
      const isOtherGuardian = !!data && data.user_id !== sessionUser!.userId;
      
      setIsGuardian(isCurrentGuardian);

      if (isOtherGuardian) {
        setShowGuardianDialog(true);
      }
    };
    checkGuardian();
  }, [selectedPdlId, sessionUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPdlId || !scheduledDate || !visitorId || !sessionUser) {
      toast.error("Please fill out all required fields.");
      return;
    }

    await processSubmission();
  };

  const processSubmission = async () => {
    setIsSubmitting(true);
    try {
      // 1. Check maximum 5 visits per day limit for this inmate
      const startOfDay = new Date(scheduledDate!);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(scheduledDate!);
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

      const needsGuardianApproval = guardianVisitor && guardianVisitor.user_id !== sessionUser!.userId;
      let finalNotesJson = null;
      let generatedToken = null;

      // Ensure Date is string format
      const isoDate = scheduledDate!.toISOString();

      if (needsGuardianApproval) {
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

      setSelectedPdlId("");
      setScheduledDate(undefined);
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
    <main className="flex-1 px-4 py-8 md:px-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="group relative overflow-hidden rounded-3xl bg-linear-to-br from-[#0a1e47] via-[#0f2f6a] to-[#1e4b8f] p-6 shadow-2xl md:p-8">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.14),transparent_35%),radial-gradient(circle_at_80%_10%,rgba(255,255,255,0.08),transparent_30%),radial-gradient(circle_at_70%_80%,rgba(255,255,255,0.12),transparent_38%)] opacity-60" />
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-2">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20 backdrop-blur-sm">
                <CalendarHeart className="h-5 w-5 text-blue-100" />
              </div>
              <h1 className="font-lexend text-2xl font-bold text-white md:text-3xl">Schedule a Visit</h1>
            </div>
            <p className="mt-2 text-blue-100/90 text-xs md:text-sm max-w-xl">
              Submit a visitation request to the facility. An administrator will review your schedule.
              Please note that an inmate allows a maximum of 5 visits per day.
            </p>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-5 shadow-xl shadow-slate-200/50 backdrop-blur-sm md:p-8">
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
                <Popover open={visitTypeOpen} onOpenChange={setVisitTypeOpen}>
                  <PopoverTrigger className="flex w-full items-center justify-between h-[46px] rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition-all focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100 hover:bg-slate-50 hover:border-blue-300 shadow-none data-[state=open]:ring-4 data-[state=open]:ring-blue-100 data-[state=open]:border-blue-400 data-[state=open]:bg-white cursor-pointer">
                    <span className="truncate">{visitType || "Select type"}</span>
                    <ChevronsUpDown className="h-4 w-4 shrink-0 text-slate-400" />
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-1.5 bg-white rounded-xl border-slate-200 shadow-xl overflow-hidden" align="start">
                    {VISIT_TYPES.map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => {
                          setVisitType(type);
                          setVisitTypeOpen(false);
                        }}
                        className={cn(
                          "flex w-full items-center justify-between rounded-md px-3 py-2 text-sm transition-colors text-left",
                          visitType === type ? "bg-slate-50 text-blue-900 font-medium" : "hover:bg-slate-50 hover:text-slate-900 text-slate-700"
                        )}
                      >
                        <span className="font-medium">{type}</span>
                        <Check className={cn("h-4 w-4 text-blue-600", visitType === type ? "opacity-100" : "opacity-0")} />
                      </button>
                    ))}
                  </PopoverContent>
                </Popover>
              </div>

              {!isGuardian && (
                <div className="space-y-2">
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Relationship to Inmate
                  </label>
                  <Popover open={relationshipOpen} onOpenChange={setRelationshipOpen}>
                    <PopoverTrigger className="flex w-full items-center justify-between h-[46px] rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition-all focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100 hover:bg-slate-50 hover:border-blue-300 shadow-none data-[state=open]:ring-4 data-[state=open]:ring-blue-100 data-[state=open]:border-blue-400 data-[state=open]:bg-white cursor-pointer">
                      <span className="truncate">{relationship || "Select relationship"}</span>
                      <ChevronsUpDown className="h-4 w-4 shrink-0 text-slate-400" />
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-1.5 bg-white rounded-xl border-slate-200 shadow-xl overflow-hidden" align="start">
                      {RELATIONSHIPS.map((rel) => (
                        <button
                          key={rel}
                          type="button"
                          onClick={() => {
                            setRelationship(rel);
                            setRelationshipOpen(false);
                          }}
                          className={cn(
                            "flex w-full items-center justify-between rounded-md px-3 py-2 text-sm transition-colors text-left",
                            relationship === rel ? "bg-slate-50 text-blue-900 font-medium" : "hover:bg-slate-50 hover:text-slate-900 text-slate-700"
                          )}
                        >
                          <span className="font-medium">{rel}</span>
                          <Check className={cn("h-4 w-4 text-blue-600", relationship === rel ? "opacity-100" : "opacity-0")} />
                        </button>
                      ))}
                    </PopoverContent>
                  </Popover>
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
              <Popover>
                <PopoverTrigger className={cn("flex w-full cursor-pointer items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition-all focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100 hover:border-blue-300", !scheduledDate && "text-slate-500")}>
                  <span>{scheduledDate ? format(scheduledDate, "PPP p") : "Pick a date and time"}</span>
                  <CalendarIcon className="h-4 w-4 text-slate-400" />
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 z-50 bg-white shadow-xl border border-slate-100" align="start">
                  <Calendar
                    mode="single"
                    selected={scheduledDate}
                    onSelect={(d) => {
                      if (!d) {
                        setScheduledDate(undefined);
                        return;
                      }
                      const newD = new Date(d);
                      if (scheduledDate) {
                        newD.setHours(scheduledDate.getHours(), scheduledDate.getMinutes(), 0, 0);
                      } else {
                        newD.setHours(9, 0, 0, 0);
                      }
                      setScheduledDate(newD);
                    }}
                    disabled={(d) => {
                      const today = new Date();
                      today.setHours(0,0,0,0);
                      return d < today;
                    }}
                    initialFocus
                    className="p-3"
                  />
                  <div className="border-t border-slate-100 p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-4 w-4 text-slate-500" />
                      <span className="text-sm font-medium text-slate-700">Time</span>
                    </div>
                    <input
                      type="time"
                      value={scheduledDate ? format(scheduledDate, "HH:mm") : "09:00"}
                      onChange={(e) => {
                        const time = e.target.value;
                        if (!time) return;
                        const [h, m] = time.split(':');
                        const newD = scheduledDate ? new Date(scheduledDate) : new Date();
                        newD.setHours(parseInt(h, 10), parseInt(m, 10), 0, 0);
                        setScheduledDate(newD);
                      }}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all cursor-text hover:border-blue-300"
                    />
                  </div>
                </PopoverContent>
              </Popover>
              <p className="text-[10px] text-slate-400 mt-1">
                Select the proposed visit time during regular facility visiting hours.
              </p>
            </div>

            <div className="pt-4 mt-8 border-t border-slate-100 flex items-center justify-end">
              <button
                type="submit"
                disabled={isSubmitting || !selectedPdlId || !visitorId}
                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-linear-to-r from-[#0f2f6a] to-[#1e4b8f] px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-900/20 transition-all hover:scale-[1.02] hover:from-[#1a3f7a] hover:to-[#2a5ca5] active:scale-95 disabled:pointer-events-none disabled:opacity-70 w-full md:w-auto"
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

      {/* Guardian Approval Dialog */}
      <Dialog open={showGuardianDialog} onOpenChange={setShowGuardianDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 mb-4 mx-auto md:mx-0">
               <AlertCircle className="h-6 w-6 text-amber-600" />
            </div>
            <DialogTitle className="text-xl font-bold text-slate-900 md:text-left text-center">Guardian Approval Required</DialogTitle>
            <DialogDescription className="text-slate-500 pt-2 md:text-left text-center">
              This PDL has a registered Guardian. If you proceed, the Guardian will receive an email and **must approve your visit** before it is sent to the administration.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-3 pt-6 mt-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowGuardianDialog(false);
                setSelectedPdlId("");
              }}
              className="rounded-xl border-slate-200 h-11 font-semibold text-slate-600 order-2 sm:order-1"
            >
              Cancel
            </Button>
            <Button 
              onClick={() => setShowGuardianDialog(false)}
              className="bg-linear-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl h-11 font-bold shadow-lg shadow-amber-900/10 border-0 order-1 sm:order-2"
            >
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
