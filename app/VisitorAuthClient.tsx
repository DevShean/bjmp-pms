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
import { useRouter } from "next/navigation";
import { FormEvent, type ReactNode, useEffect, useState } from "react";
import VisitorSplashScreen from "./components/VisitorSplashScreen";
import { supabase } from "../lib/supabase/client";

// ─── Types ───────────────────────────────────────────────────────────────────

type AuthFeedback = {
  type: "error" | "success" | "warning";
  message: string;
};

type UserRoleRecord = {
  user_id: number;
  email: string;
  password: string;
  username: string;
  roles: {
    role_name: string;
  };
};

// ─── Static copy ─────────────────────────────────────────────────────────────

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

// ─── Root component ───────────────────────────────────────────────────────────

export default function VisitorAuthClient() {
  const [showSplash, setShowSplash] = useState(true);
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const shouldReduceMotion = useReducedMotion();
  const router = useRouter();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setShowSplash(false);
    }, 5000);
    return () => window.clearTimeout(timer);
  }, []);

  const contentTransition = shouldReduceMotion
    ? { duration: 0 }
    : { duration: 0.32, ease: [0.22, 1, 0.36, 1] as const };

  if (showSplash) {
    return <VisitorSplashScreen />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-5 py-6 sm:px-8 sm:py-8">
      <main className="glass-panel animate-rise-in grid w-full max-w-5xl overflow-hidden rounded-4xl shadow-[0_24px_70px_-28px_rgba(24,49,92,0.48)] lg:grid-cols-[1.1fr_1fr]">
        {/* ── Left panel ── */}
        <section
          className="relative hidden bg-cover bg-center p-10 text-white lg:flex lg:flex-col lg:justify-between"
          style={{ backgroundImage: "url('/img/images/jailbureau-bg.png')" }}
        >
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative space-y-5">
            <div className="inline-flex items-center rounded-full border border-white/35 px-4 py-1 text-xs tracking-[0.2em] uppercase">
              Bureau of Jail Management and Penology
            </div>
            <h1 className="font-lexend max-w-sm text-4xl leading-tight font-bold">
              Visitor Management Portal
            </h1>
            <p className="max-w-md text-sm leading-7 text-blue-100">
              Register visitors, review scheduled visits, and keep facility entry records organized
              in one secure portal.
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

        {/* ── Right panel ── */}
        <section className="bg-(--surface) p-6 sm:p-8">
          <div className="mx-auto w-full max-w-md space-y-5">
            {/* Logo + heading */}
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
                  <h2 className="font-lexend text-4xl font-bold tracking-tight text-primary">
                    {authCopy[activeTab].title}
                  </h2>
                  <p className="mt-2 text-sm text-[#5f6f8f]">{authCopy[activeTab].description}</p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Tab switcher */}
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

            {/* Forms */}
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
                    <LoginForm onSuccess={() => router.push("/visitor-page")} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="register"
                    initial={{ opacity: 0, x: shouldReduceMotion ? 0 : 18, filter: "blur(6px)" }}
                    animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                    exit={{ opacity: 0, x: shouldReduceMotion ? 0 : -18, filter: "blur(6px)" }}
                    transition={contentTransition}
                  >
                    <RegisterForm onSuccess={() => setActiveTab("login")} />
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

// ─── Tab button ───────────────────────────────────────────────────────────────

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
        active ? "text-primary" : "text-(--primary-accent)"
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

// ─── Feedback banner ──────────────────────────────────────────────────────────

function FeedbackBanner({ feedback }: { feedback: AuthFeedback }) {
  const styles = {
    success: "border-emerald-200 bg-emerald-50 text-emerald-700",
    warning: "border-amber-200 bg-amber-50 text-amber-700",
    error: "border-rose-200 bg-rose-50 text-rose-700",
  };
  return (
    <div className={`rounded-xl border px-4 py-3 text-sm ${styles[feedback.type]}`}>
      {feedback.message}
    </div>
  );
}

// ─── Login form ───────────────────────────────────────────────────────────────

function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<AuthFeedback | null>(null);

  useEffect(() => {
    if (!feedback) return;
    const t = window.setTimeout(() => setFeedback(null), 4000);
    return () => window.clearTimeout(t);
  }, [feedback]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const password = String(formData.get("password") ?? "");

    if (!email || !password) {
      setFeedback({ type: "warning", message: "Please enter your email and password." });
      return;
    }

    try {
      setIsSubmitting(true);
      setFeedback(null);

      const { data: userRecord, error } = await supabase
        .from("users")
        .select("user_id, email, password, username, roles!inner(role_name)")
        .eq("email", email)
        .single<UserRoleRecord>();

      if (error || !userRecord) {
        throw new Error("No visitor account matched this email address.");
      }

      if (userRecord.roles.role_name !== "Visitor") {
        throw new Error("This portal is for visitors only. Use the staff portal instead.");
      }

      if (userRecord.password !== password) {
        throw new Error("The password you entered is incorrect.");
      }

      setFeedback({ type: "success", message: "Welcome back! Redirecting to your dashboard…" });

      // Set session cookie (24 h)
      const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toUTCString();
      document.cookie = `bjmp_session=${encodeURIComponent(
        JSON.stringify({ role: "Visitor", email: userRecord.email, userId: userRecord.user_id })
      )}; path=/; expires=${expires}; SameSite=Lax`;

      onSuccess();
    } catch (err) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "An unexpected error occurred.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="flex min-h-96 flex-col gap-4 sm:min-h-92" onSubmit={onSubmit}>
      <InputField
        id="email"
        label="Email Address"
        type="email"
        placeholder="Enter your email address"
        icon={<Mail size={18} aria-hidden="true" />}
        disabled={isSubmitting}
      />
      <InputField
        id="password"
        label="Password"
        type="password"
        placeholder="Enter your password"
        icon={<LockKeyhole size={18} aria-hidden="true" />}
        disabled={isSubmitting}
      />

      <div className="flex items-center justify-between text-sm">
        <button
          type="button"
          className="cursor-pointer inline-flex items-center gap-1 font-semibold text-primary hover:underline"
        >
          <CircleHelp size={14} aria-hidden="true" />
          Forgot Password?
        </button>
      </div>

      {feedback && <FeedbackBanner feedback={feedback} />}

      <button
        type="submit"
        disabled={isSubmitting}
        className="font-lexend flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-base font-semibold text-white transition hover:bg-[#0a1f49] disabled:cursor-not-allowed disabled:opacity-70"
      >
        <LogIn size={18} aria-hidden="true" />
        {isSubmitting ? "Signing in…" : "Sign In"}
      </button>
    </form>
  );
}

// ─── Register form ────────────────────────────────────────────────────────────

const VISITOR_ROLE_ID = 5;

function RegisterForm({ onSuccess }: { onSuccess: () => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<AuthFeedback | null>(null);

  useEffect(() => {
    if (!feedback) return;
    const t = window.setTimeout(() => setFeedback(null), 5000);
    return () => window.clearTimeout(t);
  }, [feedback]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const username = String(formData.get("userName") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const password = String(formData.get("registerPassword") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    // ── Client-side validation ──
    if (!username || !email || !password || !confirmPassword) {
      setFeedback({ type: "warning", message: "Please fill in all fields before registering." });
      return;
    }

    if (password !== confirmPassword) {
      setFeedback({ type: "error", message: "Passwords do not match. Please try again." });
      return;
    }

    if (password.length < 6) {
      setFeedback({ type: "warning", message: "Password must be at least 6 characters long." });
      return;
    }

    try {
      setIsSubmitting(true);
      setFeedback(null);

      // 1. Check if email is already taken
      const { data: existing } = await supabase
        .from("users")
        .select("user_id")
        .eq("email", email)
        .maybeSingle();

      if (existing) {
        throw new Error("An account with this email already exists. Please sign in instead.");
      }

      // 2. Insert into users table (role_id 5 = Visitor)
      const { data: newUser, error: insertUserError } = await supabase
        .from("users")
        .insert({ role_id: VISITOR_ROLE_ID, username, email, password })
        .select("user_id")
        .single<{ user_id: number }>();

      if (insertUserError || !newUser) {
        throw new Error("Failed to create your account. Please try again.");
      }

      // 3. Insert into visitors table
      const { error: insertVisitorError } = await supabase
        .from("visitors")
        .insert({ user_id: newUser.user_id });

      if (insertVisitorError) {
        // Non-critical — account exists, visitor row failed. Log but don't surface raw error.
        console.error("visitors insert error:", insertVisitorError);
      }

      // 4. Insert a skeleton profile row so the profile page can update it later
      const { error: insertProfileError } = await supabase
        .from("profiles")
        .insert({ user_id: newUser.user_id });

      if (insertProfileError) {
        // Non-critical — profile row will be upserted later
        console.error("profiles insert error:", insertProfileError);
      }

      setFeedback({
        type: "success",
        message: "Registration successful! You can now sign in to your account.",
      });

      // Reset form fields
      (event.target as HTMLFormElement).reset();

      // Switch to login tab after a short delay so user can read the success message
      const redirectTimer = window.setTimeout(() => onSuccess(), 2000);
      return () => window.clearTimeout(redirectTimer);
    } catch (err) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "An unexpected error occurred.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="flex min-h-96 flex-col gap-4 sm:min-h-92" onSubmit={onSubmit}>
      <InputField
        id="userName"
        label="Username"
        type="text"
        placeholder="Enter your username"
        icon={<UserRound size={18} aria-hidden="true" />}
        disabled={isSubmitting}
      />
      <InputField
        id="email"
        label="Email Address"
        type="email"
        placeholder="name@example.com"
        icon={<Mail size={18} aria-hidden="true" />}
        disabled={isSubmitting}
      />
      <InputField
        id="registerPassword"
        label="Password"
        type="password"
        placeholder="Create a password (min. 6 characters)"
        icon={<LockKeyhole size={18} aria-hidden="true" />}
        disabled={isSubmitting}
      />
      <InputField
        id="confirmPassword"
        label="Confirm Password"
        type="password"
        placeholder="Confirm your password"
        icon={<LockKeyhole size={18} aria-hidden="true" />}
        disabled={isSubmitting}
      />

      {feedback && <FeedbackBanner feedback={feedback} />}

      <div className="mt-auto pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="cursor-pointer font-lexend flex w-full items-center justify-center gap-2 rounded-xl bg-(--success) px-4 py-3 text-base font-semibold text-white transition hover:bg-[#285f31] disabled:cursor-not-allowed disabled:opacity-70"
        >
          <ArrowRight size={18} aria-hidden="true" />
          {isSubmitting ? "Registering…" : "Register"}
        </button>
      </div>
    </form>
  );
}

// ─── Shared input field ───────────────────────────────────────────────────────

type InputFieldProps = {
  id: string;
  label: string;
  type: "text" | "email" | "password" | "tel";
  placeholder: string;
  icon?: ReactNode;
  disabled?: boolean;
};

function InputField({ id, label, type, placeholder, icon, disabled = false }: InputFieldProps) {
  const isPassword = type === "password";
  const [showPassword, setShowPassword] = useState(false);
  const resolvedType = isPassword && showPassword ? "text" : type;

  return (
    <label className="space-y-2 text-sm" htmlFor={id}>
      <span className="font-lexend text-primary">{label}</span>
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
          disabled={disabled}
          className="w-full rounded-xl border border-(--line) bg-(--surface-strong) px-3 py-3 text-[#2f3d5b] outline-none transition placeholder:text-[#9fa9bf] focus:border-(--primary-accent) focus:ring-2 focus:ring-[#c3d4f8] disabled:opacity-60"
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
            className="absolute inset-y-0 right-2 inline-flex cursor-pointer items-center rounded-md px-1.5 text-[#7e8cab] transition hover:text-primary"
          >
            {showPassword ? <EyeOff size={17} aria-hidden="true" /> : <Eye size={17} aria-hidden="true" />}
          </button>
        ) : null}
      </div>
    </label>
  );
}