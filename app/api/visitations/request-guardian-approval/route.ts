import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(request: Request) {
  try {
    const { 
      guardianEmail, 
      guardianName, 
      visitorName, 
      inmateName, 
      visitDate, 
      visitId, 
      token 
    } = await request.json();

    if (!guardianEmail || !visitId || !token) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    // Determine base URL dynamically or use environment variable (fallback to localhost)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const approvalLink = `${baseUrl}/api/visitations/guardian-approve?visitId=${visitId}&token=${token}&action=approve`;
    const denyLink = `${baseUrl}/api/visitations/guardian-approve?visitId=${visitId}&token=${token}&action=deny`;

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    const formattedDate = new Date(visitDate).toLocaleString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });

    await transporter.sendMail({
      from: `"BJMP Visitor Portal" <${process.env.GMAIL_USER}>`,
      to: guardianEmail,
      subject: `Visitation Request Approval for ${inmateName}`,
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 500px; margin: 0 auto; background: #f8faff; border-radius: 16px; overflow: hidden; border: 1px solid #dbe6ff;">
          <div style="background: linear-gradient(135deg, #0a1e47, #1e4b8f); padding: 32px 32px 24px; text-align: center;">
            <p style="color: #93c5fd; font-size: 12px; letter-spacing: 0.15em; text-transform: uppercase; margin: 0 0 8px;">Visitation Request</p>
            <h1 style="color: #ffffff; font-size: 22px; margin: 0; font-weight: 700;">Action Required</h1>
          </div>
          <div style="padding: 32px;">
            <p style="color: #334155; font-size: 15px; margin: 0 0 16px;">Hello <strong>${guardianName || 'Guardian'}</strong>,</p>
            <p style="color: #334155; font-size: 15px; margin: 0 0 24px;">
              A visitor named <strong>${visitorName}</strong> has requested to visit your ward, PDL <strong>${inmateName}</strong>. 
            </p>
            
            <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin: 0 0 24px;">
              <p style="margin: 0 0 8px; font-size: 14px; color: #64748b;"><strong>Scheduled Date & Time:</strong></p>
              <p style="margin: 0; font-size: 15px; color: #1e293b; font-weight: 500;">${formattedDate}</p>
            </div>

            <p style="color: #334155; font-size: 14px; margin: 0 0 20px;">
              As the registered PDL Guardian, you must approve this visit before it is forwarded to the administration.
            </p>

            <div style="display: flex; gap: 12px; margin-bottom: 24px; flex-direction: column;">
              <a href="${approvalLink}" style="display: block; text-align: center; background: #059669; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 15px;">Approve Visit</a>
              <a href="${denyLink}" style="display: block; text-align: center; background: #ffffff; color: #e11d48; border: 1px solid #e11d48; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 15px;">Deny Request</a>
            </div>
            
            <p style="color: #64748b; font-size: 13px; margin: 0;">If you don't respond, the request will remain pending and cannot be approved by admins.</p>
          </div>
          <div style="background: #f1f5f9; padding: 16px 32px; text-align: center; border-top: 1px solid #e2e8f0;">
            <p style="color: #94a3b8; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} BJMP Visitor Portal. All rights reserved.</p>
          </div>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("guardian approval email error:", error);
    return NextResponse.json({ error: "Failed to send guardian approval email." }, { status: 500 });
  }
}
