import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
    ""
);

type VerificationRow = {
  code: string;
  expires_at: string;
  used: boolean;
};

export async function POST(request: Request) {
  try {
    const { userId, code } = await request.json();

    if (!userId || !code) {
      return NextResponse.json({ error: "userId and code are required." }, { status: 400 });
    }

    // Fetch the stored code for this user
    const { data, error: fetchError } = await supabase
      .from("email_verification_codes")
      .select("code, expires_at, used")
      .eq("user_id", userId)
      .maybeSingle<VerificationRow>();

    if (fetchError || !data) {
      return NextResponse.json(
        { error: "No verification code found. Please request a new one." },
        { status: 400 }
      );
    }

    if (data.used) {
      return NextResponse.json(
        { error: "This code has already been used. Please request a new one." },
        { status: 400 }
      );
    }

    if (new Date(data.expires_at) < new Date()) {
      return NextResponse.json(
        { error: "This code has expired. Please request a new one." },
        { status: 400 }
      );
    }

    if (data.code !== code.trim()) {
      return NextResponse.json({ error: "Incorrect code. Please try again." }, { status: 400 });
    }

    // Mark code as used
    await supabase
      .from("email_verification_codes")
      .update({ used: true })
      .eq("user_id", userId);

    // Mark email as verified in profiles
    await supabase
      .from("profiles")
      .update({ is_email_verified: true })
      .eq("user_id", userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("verify-code error:", error);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}
