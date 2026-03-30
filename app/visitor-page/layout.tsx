"use client";

import { useState, useEffect, createContext, useContext } from "react";
import { supabase } from "../../lib/supabase/client";
import VisitorSidebar from "../components/VisitorSidebar";
import VisitorHeader from "../components/VisitorHeader";
import VisitorSplashScreen from "../components/VisitorSplashScreen";

type SessionUser = {
  userId: number;
  email: string;
  name?: string;
  photo_url?: string | null;
};

interface VisitorContextType {
  sessionUser: SessionUser | null;
  isLoading: boolean;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (collapsed: boolean) => void;
}

const VisitorContext = createContext<VisitorContextType | undefined>(undefined);

export function useVisitor() {
  const context = useContext(VisitorContext);
  if (context === undefined) {
    throw new Error("useVisitor must be used within a VisitorProvider");
  }
  return context;
}

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

export default function VisitorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [minLoadingTimeElapsed, setMinLoadingTimeElapsed] = useState(false);

  // Initialize sidebar state based on screen width
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setIsSidebarCollapsed(true);
    }

    const timer = setTimeout(() => {
      setMinLoadingTimeElapsed(true);
    }, 2100); // 2.1s minimum splash time

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const session = getSession();
    if (!session) {
      setIsLoading(false);
      return;
    }

    const loadProfile = async () => {
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("firstname, lastname, photo_url")
          .eq("user_id", session.userId)
          .maybeSingle();

        const name = profile
          ? `${profile.firstname || ""} ${profile.lastname || ""}`.trim()
          : "Visitor";
          
        setSessionUser({
          ...session,
          name,
          photo_url: profile?.photo_url || null,
        });
      } catch (error) {
        console.error("Error loading profile:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, []);

  return (
    <VisitorContext.Provider
      value={{
        sessionUser,
        isLoading,
        isSidebarCollapsed,
        setIsSidebarCollapsed,
      }}
    >
      {isLoading || !minLoadingTimeElapsed ? (
        <VisitorSplashScreen isReady={!isLoading} />
      ) : (
        <div className="flex min-h-screen w-full bg-linear-to-br from-slate-50 via-white to-blue-50/30">
          <VisitorSidebar
            sessionUser={sessionUser}
            isCollapsed={isSidebarCollapsed}
            onMobileClose={() => setIsSidebarCollapsed(true)}
          />
          <div className="flex flex-1 flex-col pb-12 w-full min-w-0">
            <VisitorHeader
              isSidebarCollapsed={isSidebarCollapsed}
              onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              sessionUser={sessionUser}
            />
            {children}
          </div>
        </div>
      )}
    </VisitorContext.Provider>
  );
}
