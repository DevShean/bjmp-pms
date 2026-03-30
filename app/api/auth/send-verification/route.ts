import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
    ""
);

export async function POST(request: Request) {
  try {
    const { userId, email } = await request.json();

    if (!userId || !email) {
      return NextResponse.json({ error: "userId and email are required." }, { status: 400 });
    }

    // Generate a secure 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 min TTL

    // Upsert the code — one active code per user at a time
    const { error: dbError } = await supabase
      .from("email_verification_codes")
      .upsert(
        {
          user_id: userId,
          code,
          expires_at: expiresAt,
          used: false,
        },
        { onConflict: "user_id" }
      );

    if (dbError) {
      console.error("DB upsert error:", dbError);
      return NextResponse.json({ error: "Failed to generate verification code." }, { status: 500 });
    }

    // Send email via Gmail + App Password
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: `"BJMP Visitor Portal" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: "Your BJMP Email Verification Code",
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #f8faff; border-radius: 16px; overflow: hidden; border: 1px solid #dbe6ff;">
          <div style="background: linear-gradient(135deg, #0a1e47, #1e4b8f); padding: 32px 32px 24px; text-align: center;">
            <p style="color: #93c5fd; font-size: 12px; letter-spacing: 0.15em; text-transform: uppercase; margin: 0 0 8px;">Bureau of Jail Management and Penology</p>
            <h1 style="color: #ffffff; font-size: 22px; margin: 0; font-weight: 700;">Email Verification</h1>
          </div>
          <div style="padding: 32px;">
            <p style="color: #334155; font-size: 15px; margin: 0 0 24px;">Use the verification code below to confirm your email address. This code expires in <strong>10 minutes</strong>.</p>
            <div style="background: #ffffff; border: 2px dashed #3b82f6; border-radius: 12px; padding: 20px; text-align: center; margin: 0 0 24px;">
              <span style="font-size: 40px; font-weight: 800; letter-spacing: 0.3em; color: #0f2f6a; font-family: 'Courier New', monospace;">${code}</span>
            </div>
            <p style="color: #64748b; font-size: 13px; margin: 0;">If you did not request this code, please ignore this email. Do not share this code with anyone.</p>
          </div>
          <div style="background: #f1f5f9; padding: 16px 32px; text-align: center; border-top: 1px solid #e2e8f0;">
            <p style="color: #94a3b8; font-size: 12px; margin: 0;">© 2026 BJMP Visitor Portal. All rights reserved.</p>
          </div>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("send-verification error:", error);
    return NextResponse.json({ error: "Failed to send verification email." }, { status: 500 });
  }
}
