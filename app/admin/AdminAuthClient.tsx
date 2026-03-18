"use client";

import { FormEvent, ReactNode, useEffect, useState } from "react";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowRight, Building2, Eye, EyeOff, KeyRound, Mail, ShieldCheck, UserRound } from "lucide-react";
import AppSplashScreen from "../components/AppSplashScreen";

type RoleKey = "administrator" | "correctionalOfficer" | "medicalStaff" | "rehabilitationStaff";

const roleCopy: Record<RoleKey, { title: string; subtitle: string; actionLabel: string }> = {
  administrator: {
    title: "Administrator Access",
    subtitle: "System configuration, user controls, and incident oversight.",
    actionLabel: "Administrator",
  },
  correctionalOfficer: {
    title: "Correctional Officer Access",
    subtitle: "Monitor facility security, inmate movement, and duty logs.",
    actionLabel: "Correctional Officer",
  },
  medicalStaff: {
    title: "Medical Staff Access",
    subtitle: "Track inmate health records, consultations, and treatment schedules.",
    actionLabel: "Medical Staff",
  },
  rehabilitationStaff: {
    title: "Rehabilitation Staff Access",
    subtitle: "Manage intervention programs, progress plans, and reintegration notes.",
    actionLabel: "Rehabilitation Staff",
  },
};

export default function AdminAuthClient() {
  const [showSplash, setShowSplash] = useState(true);
  const [activeRole, setActiveRole] = useState<RoleKey>("administrator");
  const shouldReduceMotion = useReducedMotion();
  const router = useRouter();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setShowSplash(false);
    }, 1000); // Show splash screen for at least 2 seconds

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  const panelTransition = shouldReduceMotion
    ? { duration: 0 }
    : { duration: 0.32, ease: [0.22, 1, 0.36, 1] as const };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const roleRoutes: Record<RoleKey, string> = {
      administrator: "/admin-page",
      correctionalOfficer: "/officer-page",
      medicalStaff: "/medical-page",
      rehabilitationStaff: "/rehab-page",
    };

    router.push(roleRoutes[activeRole]);
  };

  if (showSplash) {
    return <AppSplashScreen />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-5 py-6 sm:px-8 sm:py-8">
      <main className="glass-panel animate-rise-in grid w-full max-w-5xl overflow-hidden rounded-4xl shadow-[0_24px_70px_-28px_rgba(24,49,92,0.48)] lg:grid-cols-[1.05fr_1fr]">
        <section
          className="relative hidden bg-cover bg-center p-10 text-white lg:flex lg:flex-col lg:justify-between"
          style={{ backgroundImage: "url('/img/images/jailbureau-bg.png')" }}
        >
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative space-y-5">
            <div className="inline-flex items-center rounded-full border border-white/35 px-4 py-1 text-xs uppercase tracking-[0.2em]">
              BJMP Internal Portal
            </div>
            <h1 className="font-lexend max-w-sm text-4xl leading-tight font-bold">
              Staff Authentication Hub
            </h1>
            <p className="max-w-md text-sm leading-7 text-blue-100">
              Secure access for authorized personnel handling administration, operations, and records.
            </p>
          </div>
          <div className="relative grid gap-4 text-sm text-blue-50">
            <article className="rounded-2xl border border-white/20 bg-white/10 p-4">
              <p className="font-lexend text-base font-semibold">Role-Based Entry</p>
              <p className="mt-1 text-blue-100">
                Separate credentials and controls for administrators and officers.
              </p>
            </article>
            <article className="rounded-2xl border border-white/20 bg-white/10 p-4">
              <p className="font-lexend text-base font-semibold">Audit-Friendly Workflow</p>
              <p className="mt-1 text-blue-100">
                Keep access trails consistent for compliance and operational accountability.
              </p>
            </article>
          </div>
        </section>

        <section className="bg-(--surface) p-6 sm:p-8">
          <div className="mx-auto w-full max-w-md space-y-5">
            <div className="space-y-3 text-center">
              <motion.div
                animate={{ scale: 1, opacity: 1 }}
                initial={{ scale: 0.94, opacity: 0 }}
                transition={panelTransition}
              >
                <Image
                  src="/img/logo/logo.png"
                  alt="BJMP Logo"
                  width={82}
                  height={82}
                  className="mx-auto h-20.5 w-20.5 object-contain"
                  priority
                />
              </motion.div>
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={activeRole}
                  initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: shouldReduceMotion ? 0 : -10 }}
                  transition={panelTransition}
                >
                  <h2 className="font-lexend text-4xl font-bold tracking-tight text-(--primary)">
                    {roleCopy[activeRole].title}
                  </h2>
                  <p className="mt-2 text-sm text-[#5f6f8f]">{roleCopy[activeRole].subtitle}</p>
                </motion.div>
              </AnimatePresence>
            </div>

            <LayoutGroup id="role-tabs">
              <div className="relative grid grid-cols-2 gap-2 rounded-xl bg-(--primary-soft) p-1.5 sm:grid-cols-4">
                <RoleTab
                  active={activeRole === "administrator"}
                  onClick={() => setActiveRole("administrator")}
                  transition={panelTransition}
                  icon={<ShieldCheck size={16} aria-hidden="true" />}
                >
                  Admin
                </RoleTab>
                <RoleTab
                  active={activeRole === "correctionalOfficer"}
                  onClick={() => setActiveRole("correctionalOfficer")}
                  transition={panelTransition}
                  icon={<Building2 size={16} aria-hidden="true" />}
                >
                  Officer
                </RoleTab>
                <RoleTab
                  active={activeRole === "medicalStaff"}
                  onClick={() => setActiveRole("medicalStaff")}
                  transition={panelTransition}
                  icon={<KeyRound size={16} aria-hidden="true" />}
                >
                  Medical
                </RoleTab>
                <RoleTab
                  active={activeRole === "rehabilitationStaff"}
                  onClick={() => setActiveRole("rehabilitationStaff")}
                  transition={panelTransition}
                  icon={<UserRound size={16} aria-hidden="true" />}
                >
                  Rehab
                </RoleTab>
              </div>
            </LayoutGroup>

            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={activeRole}
                initial={{ opacity: 0, x: shouldReduceMotion ? 0 : -16, filter: "blur(6px)" }}
                animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, x: shouldReduceMotion ? 0 : 16, filter: "blur(6px)" }}
                transition={panelTransition}
              >
                <form className="flex min-h-100 flex-col gap-4" onSubmit={onSubmit}>
                  <InputField
                    id="staffId"
                    label="Staff ID"
                    type="text"
                    placeholder="Enter staff ID"
                    icon={<UserRound size={18} aria-hidden="true" />}
                  />
                  <InputField
                    id="staffEmail"
                    label="Official Email"
                    type="email"
                    placeholder="name@bjmp.gov.ph"
                    icon={<Mail size={18} aria-hidden="true" />}
                  />
                  <InputField
                    id="staffPassword"
                    label="Password"
                    type="password"
                    placeholder="Enter your password"
                    icon={<KeyRound size={18} aria-hidden="true" />}
                  />
                  <InputField
                    id="facilityCode"
                    label="Facility Code"
                    type="text"
                    placeholder="Enter assigned facility code"
                    icon={<ShieldCheck size={18} aria-hidden="true" />}
                  />

                  <div className="mt-auto pt-3">
                    <button
                      type="submit"
                      className="font-lexend flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-(--primary) px-4 py-3 text-base font-semibold text-white transition hover:brightness-110"
                    >
                      <ArrowRight size={18} aria-hidden="true" />
                      Continue as {roleCopy[activeRole].actionLabel}
                    </button>
                  </div>
                </form>
              </motion.div>
            </AnimatePresence>

            <p className="text-center text-xs text-[#64718f]">
              For authorized BJMP personnel only. Activity is monitored and logged.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

type RoleTabProps = {
  active: boolean;
  children: string;
  icon: ReactNode;
  onClick: () => void;
  transition: {
    duration: number;
    ease?: readonly [number, number, number, number];
  };
};

function RoleTab({ active, children, icon, onClick, transition }: RoleTabProps) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={`relative cursor-pointer overflow-hidden rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
        active ? "text-(--primary)" : "text-(--primary-accent)"
      }`}
      onClick={onClick}
    >
      {active ? (
        <motion.span
          layoutId="role-tab-indicator"
          className="absolute inset-0 rounded-lg bg-(--surface-strong) shadow"
          transition={transition}
        />
      ) : null}
      <span className="font-lexend relative z-10 inline-flex items-center justify-center gap-2">
        {icon}
        {children}
      </span>
    </button>
  );
}

type InputFieldProps = {
  id: string;
  label: string;
  type: "text" | "email" | "password";
  placeholder: string;
  icon?: ReactNode;
};

function InputField({ id, label, type, placeholder, icon }: InputFieldProps) {
  const isPassword = type === "password";
  const [showPassword, setShowPassword] = useState(false);
  const resolvedType = isPassword && showPassword ? "text" : type;

  return (
    <label className="space-y-2 text-sm" htmlFor={id}>
      <span className="font-lexend text-(--primary)">{label}</span>
      <div className="relative">
        {icon ? (
          <span className="pointer-events-none absolute inset-y-0 left-3 inline-flex items-center text-[#8191b3]">
            {icon}
          </span>
        ) : null}
        <input
          id={id}
          name={id}
          type={resolvedType}
          placeholder={placeholder}
          className="w-full rounded-xl border border-(--line) bg-(--surface-strong) px-3 py-3 text-[#2f3d5b] outline-none transition placeholder:text-[#9fa9bf] focus:border-(--primary-accent) focus:ring-2 focus:ring-[#c3d4f8]"
          style={{
            ...(icon ? { paddingLeft: "2.55rem" } : {}),
            ...(isPassword ? { paddingRight: "2.85rem" } : {}),
          }}
        />
        {isPassword ? (
          <button
            type="button"
            aria-label={showPassword ? "Hide password" : "Show password"}
            onClick={() => setShowPassword((current) => !current)}
            className="absolute inset-y-0 right-2 inline-flex cursor-pointer items-center rounded-md px-1.5 text-[#7e8cab] transition hover:text-(--primary)"
          >
            {showPassword ? <EyeOff size={17} aria-hidden="true" /> : <Eye size={17} aria-hidden="true" />}
          </button>
        ) : null}
      </div>
    </label>
  );
}