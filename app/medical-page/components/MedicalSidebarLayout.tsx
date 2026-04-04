"use client";

import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import StaffHeader from "../../components/StaffHeader";
import StaffSidebar from "../../components/StaffSidebar";
import AppSplashScreen from "../../components/AppSplashScreen";
import { isSplashShown, setSplashShown } from "@/app/lib/utils/splash_session";
import { supabase } from "@/lib/supabase/client";

type MedicalSidebarLayoutProps = {
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

export default function MedicalSidebarLayout({ children }: MedicalSidebarLayoutProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showSplash, setShowSplash] = useState(!isSplashShown());
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);

  useEffect(() => {
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

      setSessionUser({
        userId: session.userId,
        name: user?.username || "Medical Staff",
        email: session.email,
      });
    };

    loadProfile();
  }, []);

  if (showSplash) {
    return <AppSplashScreen />;
  }

  return (
    <div className="flex min-h-screen w-full bg-slate-50">
      <StaffSidebar
        role="medical"
        isCollapsed={isSidebarCollapsed}
        sessionUser={{
          name: sessionUser?.name || "Medical Staff",
          email: sessionUser?.email || "medical@bjmp.portal",
        }}
      />

      <div className="flex flex-1 flex-col min-w-0">
        <StaffHeader
          role="medical"
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleSidebar={() => setIsSidebarCollapsed((prev) => !prev)}
          sessionUser={{
            userId: sessionUser?.userId,
            name: sessionUser?.name || "Medical Staff",
            email: sessionUser?.email || "medical@bjmp.portal",
          }}
        />

        <main className="flex-1 px-6 py-8 md:px-10 min-w-0 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
