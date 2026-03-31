"use client";

import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import StaffHeader from "../../components/StaffHeader";
import StaffSidebar from "../../components/StaffSidebar";
import AppSplashScreen from "../../components/AppSplashScreen";
import { isSplashShown, setSplashShown } from "@/app/lib/utils/splash_session";
import { supabase } from "@/lib/supabase/client";

type OfficerSidebarLayoutProps = {
  children: ReactNode;
};

type SessionUser = {
  userId: number;
  name: string;
  email: string;
};

function getSession(): { userId: number; email: string; role: string } | null {
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

export default function OfficerSidebarLayout({ children }: OfficerSidebarLayoutProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showSplash, setShowSplash] = useState(!isSplashShown());
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    // Only handle the timer if the splash is currently showing
    if (showSplash) {
      const timer = window.setTimeout(() => {
        setShowSplash(false);
        setSplashShown(true);
      }, 5000);
      return () => window.clearTimeout(timer);
    }
  }, [showSplash]);

  useEffect(() => {
    const session = getSession();
    if (!session) return;

    const loadProfile = async () => {
      const { data: user } = await supabase
        .from("users")
        .select("username")
        .eq("user_id", session.userId)
        .single();

      if (user) {
        setSessionUser({
          userId: session.userId,
          name: user.username,
          email: session.email,
        });
      } else {
        // Fallback if user lookup fails
        setSessionUser({
          userId: session.userId,
          name: "Duty Officer",
          email: session.email,
        });
      }
    };

    loadProfile();
  }, []);

  if (showSplash) {
    return <AppSplashScreen />;
  }

  return (
    <div className="flex min-h-screen w-full bg-slate-50">
      <StaffSidebar
        role="officer"
        isCollapsed={isSidebarCollapsed}
        sessionUser={{
          name: sessionUser?.name || "Duty Officer",
          email: sessionUser?.email || "officer@bjmp.portal",
        }}
      />

      <div className="flex flex-1 flex-col min-w-0">
        <StaffHeader
          role="officer"
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleSidebar={() => setIsSidebarCollapsed((prev) => !prev)}
          sessionUser={{
            userId: sessionUser?.userId,
            name: sessionUser?.name || "Duty Officer",
            email: sessionUser?.email || "officer@bjmp.portal",
          }}
        />

        <main className="flex-1 px-6 py-8 md:px-10 min-w-0 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
