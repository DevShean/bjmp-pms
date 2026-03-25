"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import StaffHeader from "../../components/StaffHeader";
import StaffSidebar from "../../components/StaffSidebar";
import AppSplashScreen from "../../components/AppSplashScreen";
import { useEffect } from "react";
import { isSplashShown, setSplashShown } from "@/app/lib/utils/splash_session";

type AdminSidebarLayoutProps = {
  children: ReactNode;
};

export default function AdminSidebarLayout({ children }: AdminSidebarLayoutProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showSplash, setShowSplash] = useState(!isSplashShown());

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

  if (showSplash) {
    return <AppSplashScreen />;
  }

  return (
    <div className="flex min-h-screen w-full bg-slate-50">
      <StaffSidebar
        role="admin"
        isCollapsed={isSidebarCollapsed}
        sessionUser={{
          name: "Administrator",
          email: "admin@bjmp.portal",
        }}
      />

      <div className="flex flex-1 flex-col min-w-0">
        <StaffHeader
          role="admin"
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleSidebar={() => setIsSidebarCollapsed((prev) => !prev)}
          sessionUser={{
            name: "Administrator",
            email: "admin@bjmp.portal",
          }}
        />

        <main className="flex-1 px-6 py-8 md:px-10 min-w-0 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}