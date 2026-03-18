"use client";

import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "motion/react";
import {
  ArrowRight,
  CircleHelp,
  Eye,
  EyeOff,
  LockKeyhole,
  LogIn,
  Mail,
  UserPlus,
  UserRound,
} from "lucide-react";
import Image from "next/image";
import { FormEvent, type ReactNode, useState } from "react";

const authCopy = {
  login: {
    title: "Visitor Sign In",
    description: "Access your visit requests, schedules, and approval status.",
  },
  register: {
    title: "Visitor Registration",
    description: "Create a visitor profile to request and manage facility visits.",
  },
} as const;

export default function Home() {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const shouldReduceMotion = useReducedMotion();

  const contentTransition = shouldReduceMotion
    ? { duration: 0 }
    : { duration: 0.32, ease: [0.22, 1, 0.36, 1] as const };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-5 py-6 sm:px-8 sm:py-8">
      <main className="glass-panel animate-rise-in grid w-full max-w-5xl overflow-hidden rounded-4xl shadow-[0_24px_70px_-28px_rgba(24,49,92,0.48)] lg:grid-cols-[1.1fr_1fr]">
        <section className="relative hidden bg-[linear-gradient(160deg,#0b2559_0%,#12306d_58%,#1c4ea4_100%)] p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="absolute inset-0 opacity-25 [background:radial-gradient(circle_at_25%_20%,#8eb2ff_0,transparent_35%),radial-gradient(circle_at_80%_85%,#83c7ff_0,transparent_40%)]" />
          <div className="relative space-y-5">
            <div className="inline-flex items-center rounded-full border border-white/35 px-4 py-1 text-xs tracking-[0.2em] uppercase">
              Bureau of Jail Management and Penology
            </div>
            <h1 className="font-lexend max-w-sm text-4xl leading-tight font-bold">
              Visitor Management Portal
            </h1>
            <p className="max-w-md text-sm leading-7 text-blue-100">
              Register visitors, review scheduled visits, and keep facility entry
              records organized in one secure portal.
            </p>
          </div>
          <div className="relative grid gap-4 text-sm text-blue-50">
            <article className="rounded-2xl border border-white/20 bg-white/10 p-4">
              <p className="font-lexend text-base font-semibold">Visit Scheduling</p>
              <p className="mt-1 text-blue-100">
                Track approved appointments, preferred dates, and visit windows.
              </p>
            </article>
            <article className="rounded-2xl border border-white/20 bg-white/10 p-4">
              <p className="font-lexend text-base font-semibold">Identity Verification</p>
              <p className="mt-1 text-blue-100">
                Store visitor identity details for faster screening and gate checks.
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
                transition={contentTransition}
              >
                <Image
                  src="/img/logo/logo.png"
                  alt="BJMP Logo"
                  width={86}
                  height={86}
                  className="mx-auto h-21.5 w-21.5 object-contain"
                  priority
                />
              </motion.div>
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: shouldReduceMotion ? 0 : -10 }}
                  transition={contentTransition}
                >
                  <h2 className="font-lexend text-4xl font-bold tracking-tight text-(--primary)">
                    {authCopy[activeTab].title}
                  </h2>
                  <p className="mt-2 text-sm text-[#5f6f8f]">{authCopy[activeTab].description}</p>
                </motion.div>
              </AnimatePresence>
            </div>

            <LayoutGroup id="auth-tabs">
              <div className="relative grid grid-cols-2 gap-2 rounded-xl bg-(--primary-soft) p-1.5">
                <AuthTabButton
                  active={activeTab === "login"}
                  onClick={() => setActiveTab("login")}
                  transition={contentTransition}
                  icon={<LogIn size={16} aria-hidden="true" />}
                >
                  Sign In
                </AuthTabButton>
                <AuthTabButton
                  active={activeTab === "register"}
                  onClick={() => setActiveTab("register")}
                  transition={contentTransition}
                  icon={<UserPlus size={16} aria-hidden="true" />}
                >
                  Register
                </AuthTabButton>
              </div>
            </LayoutGroup>

            <div className="relative min-h-96 sm:min-h-92">
              <AnimatePresence mode="wait" initial={false}>
                {activeTab === "login" ? (
                  <motion.div
                    key="login"
                    initial={{ opacity: 0, x: shouldReduceMotion ? 0 : -18, filter: "blur(6px)" }}
                    animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                    exit={{ opacity: 0, x: shouldReduceMotion ? 0 : 18, filter: "blur(6px)" }}
                    transition={contentTransition}
                  >
                    <LoginForm onSubmit={onSubmit} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="register"
                    initial={{ opacity: 0, x: shouldReduceMotion ? 0 : 18, filter: "blur(6px)" }}
                    animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                    exit={{ opacity: 0, x: shouldReduceMotion ? 0 : -18, filter: "blur(6px)" }}
                    transition={contentTransition}
                  >
                    <RegisterForm onSubmit={onSubmit} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <p className="text-center text-xs text-[#64718f]">
              2026 BJMP Visitor Portal. Registration is subject to facility approval.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

type AuthTabButtonProps = {
  active: boolean;
  children: string;
  icon: ReactNode;
  onClick: () => void;
  transition: {
    duration: number;
    ease?: readonly [number, number, number, number];
  };
};

function AuthTabButton({ active, children, icon, onClick, transition }: AuthTabButtonProps) {
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
          layoutId="auth-tab-indicator"
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

type AuthFormProps = {
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

function LoginForm({ onSubmit }: AuthFormProps) {
  return (
    <form className="flex min-h-96 flex-col gap-4 sm:min-h-92" onSubmit={onSubmit}>
      <InputField
        id="email"
        label="Email Address"
        type="email"
        placeholder="Enter your email address"
        icon={<Mail size={18} aria-hidden="true" />}
      />
      <InputField
        id="password"
        label="Password"
        type="password"
        placeholder="Enter your password"
        icon={<LockKeyhole size={18} aria-hidden="true" />}
      />

      <div className="flex items-center justify-between text-sm">
        <label className="flex items-center gap-2 text-[#4d5f84]">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-(--line) text-(--primary) focus:ring-(--primary)"
          />
          Keep me signed in
        </label>
        <button type="button" className="inline-flex items-center gap-1 font-semibold text-(--primary) hover:underline">
          <CircleHelp size={14} aria-hidden="true" />
          Forget Password?
        </button>
      </div>

      <button
        type="submit"
        className="font-lexend flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-(--primary) px-4 py-3 text-base font-semibold text-white transition hover:bg-[#0a1f49]"
      >
        <LogIn size={18} aria-hidden="true" />
        Sign In
      </button>
    </form>
  );
}

function RegisterForm({ onSubmit }: AuthFormProps) {
  return (
    <form className="flex min-h-96 flex-col gap-4 sm:min-h-92" onSubmit={onSubmit}>
      <InputField
        id="userName"
        label="Username"
        type="text"
        placeholder="Enter your username"
        icon={<UserRound size={18} aria-hidden="true" />}
      />
      <InputField
        id="email"
        label="Email Address"
        type="email"
        placeholder="name@example.com"
        icon={<Mail size={18} aria-hidden="true" />}
      />
      <InputField
        id="registerPassword"
        label="Password"
        type="password"
        placeholder="Create a password"
        icon={<LockKeyhole size={18} aria-hidden="true" />}
      />
      <InputField
        id="confirmPassword"
        label="Confirm Password"
        type="password"
        placeholder="Confirm your password"
        icon={<LockKeyhole size={18} aria-hidden="true" />}
      />

      <div className="mt-auto pt-2">
        <button
          type="submit"
          className="cursor-pointer font-lexend flex w-full items-center justify-center gap-2 rounded-xl bg-(--success) px-4 py-3 text-base font-semibold text-white transition hover:bg-[#285f31]"
        >
          <ArrowRight size={18} aria-hidden="true" />
          Register
        </button>
      </div>
    </form>
  );
}

type InputFieldProps = {
  id: string;
  label: string;
  type: "text" | "email" | "password" | "tel";
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

