import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
    ""
);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const visitId = searchParams.get("visitId");
    const token = searchParams.get("token");
    const action = searchParams.get("action"); // "approve" | "deny"

    if (!visitId || !token || !action) {
      return new NextResponse("Invalid request parameters.", { status: 400 });
    }

    // Attempt to fetch the visit row
    const { data: visitRow, error: fetchError } = await supabase
      .from("visitations")
      .select("notes, inmate_id, visitor_id")
      .eq("visit_id", visitId)
      .maybeSingle();

    if (fetchError || !visitRow) {
      return new NextResponse("Visitation request not found.", { status: 404 });
    }

    // Try parsing the notes as JSON
    let notesData;
    try {
      notesData = JSON.parse(visitRow.notes || "{}");
    } catch {
      return new NextResponse("Visitation is not pending guardian approval or is corrupted.", { status: 400 });
    }

    if (!notesData.pending_guardian_approval || notesData.token !== token) {
      return new NextResponse("Invalid or expired authorization token.", { status: 403 });
    }

    // Apply the update based on the action
    const newNotes = { ...notesData };
    delete newNotes.pending_guardian_approval;
    delete newNotes.token;
    newNotes.guardian_decision = action;

    const newStatus = action === "deny" ? "Denied" : "Pending";

    const { error: updateError } = await supabase
      .from("visitations")
      .update({
        notes: JSON.stringify(newNotes),
        status: newStatus,
      })
      .eq("visit_id", visitId);

    if (updateError) {
      console.error("Update error:", updateError);
      return new NextResponse("Database error. Unable to process your decision.", { status: 500 });
    }

    // If approved, notify the administrators
    if (action === "approve") {
      const { data: admins } = await supabase
        .from("users")
        .select("user_id")
        .eq("role_id", 1);

      if (admins && admins.length > 0) {
        const notifications = admins.map((admin) => ({
          user_id: admin.user_id,
          title: "New Visitation Request",
          message: `A new visitation request for PDL #${visitRow.inmate_id} has been guardian-approved and requires your review.`,
          type: "visitation_request",
          is_read: false,
        }));
        await supabase.from("notifications").insert(notifications);
      }
    }

    // Render a nice HTML response
    const bgColor = action === "approve" ? "#059669" : "#e11d48";
    const title = action === "approve" ? "Request Approved" : "Request Denied";
    const text = action === "approve" 
      ? "Thank you! You have successfully approved this visitation request. It has been forwarded to the administration for final review."
      : "You have denied this visitation request. The visitor has been blocked from seeing this PDL on this date.";

    return new NextResponse(`
      <html>
        <head>
          <title>Guardian Approval</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
        </head>
        <body style="font-family: Arial, sans-serif; background: #f8faff; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0;">
          <div style="background: white; padding: 40px; border-radius: 12px; box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1); max-width: 400px; text-align: center;">
            <div style="background: ${bgColor}; width: 64px; height: 64px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px;">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                ${action === "approve" 
                  ? '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline>'
                  : '<line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>'}
              </svg>
            </div>
            <h1 style="color: #1e293b; font-size: 24px; margin-bottom: 12px;">${title}</h1>
            <p style="color: #64748b; font-size: 15px; line-height: 1.5;">${text}</p>
          </div>
        </body>
      </html>
    `, { headers: { "Content-Type": "text/html" } });

  } catch (err) {
    console.error("approve route error", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
