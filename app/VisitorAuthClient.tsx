"use client";

import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "motion/react";
import {
  Construction,
  Eye,
  EyeOff,
  Facebook,
  LockKeyhole,
  LogIn,
  Mail,
  UserPlus,
  UserRound,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FormEvent, type ReactNode, useEffect, useState } from "react";
import { toast } from "sonner";
import VisitorSplashScreen from "./components/VisitorSplashScreen";
import { supabase } from "../lib/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";

// ─── Types ───────────────────────────────────────────────────────────────────

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
    heading: "Welcome Back",
    description: "Sign in to access the BJMP Visitor Dashboard",
  },
  register: {
    heading: "Create Account",
    description: "Register a visitor profile to request facility visits",
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
    <div className="h-screen overflow-hidden">
      <main className="animate-rise-in grid h-screen lg:grid-cols-[0.8fr_1.2fr]">
        {/* ── Left panel — Form ── */}
        <section className="flex items-center justify-center overflow-y-auto bg-(--surface) p-8 sm:p-10 lg:p-12">
          <div className="mx-auto flex h-full w-full max-w-md flex-col">
            {/* Logo + heading */}
            <div className="space-y-1 text-center">
              <motion.div
                animate={{ scale: 1, opacity: 1 }}
                initial={{ scale: 0.94, opacity: 0 }}
                transition={contentTransition}
              >
                <Image
                  src="/img/logo/logo.png"
                  alt="BJMP Logo"
                  width={78}
                  height={78}
                  className="mx-auto h-19.5 w-19.5 object-contain"
                  priority
                />
                <p className="font-lexend mt-1 text-sm font-bold tracking-wide text-[#1a2744]">
                  BJMP - PMS
                </p>
              </motion.div>

              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: shouldReduceMotion ? 0 : -10 }}
                  transition={contentTransition}
                >
                  <h2 className="font-lexend text-3xl font-bold tracking-tight text-[#1a2744]">
                    {authCopy[activeTab].heading}
                  </h2>
                  <p className="mt-1.5 text-sm text-[#5f6f8f]">
                    {authCopy[activeTab].description}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Tab switcher */}
            <LayoutGroup id="auth-tabs">
              <div className="relative mt-5 grid grid-cols-2 gap-2 rounded-xl bg-(--primary-soft) p-1.5">
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
            <div className="relative mt-5 flex-1">
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

            {/* Footer — contact icons */}
            <div className="mt-6 flex flex-col items-center gap-2">
              <p className="text-xs text-[#64718f]">Get in touch with us</p>
              <div className="flex gap-3">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-(--line) text-[#5f6f8f] transition hover:bg-(--primary-soft) hover:text-(--primary-accent)">
                  <Mail size={16} aria-hidden="true" />
                </span>
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-(--line) text-[#5f6f8f] transition hover:bg-(--primary-soft) hover:text-(--primary-accent)">
                  <Facebook size={16} aria-hidden="true" />
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ── Right panel — Branding ── */}
        <section
          className="relative hidden overflow-hidden bg-cover bg-center p-10 text-white lg:flex lg:flex-col lg:justify-between"
          style={{ backgroundImage: "url('/img/images/jailbureau-bg.png')" }}
        >
          <div className="absolute inset-0 bg-linear-to-br from-[#0c1e44]/70 via-[#0f2b5e]/60 to-[#0c1e44]/70" />

          {/* Top */}
          <div className="relative space-y-5">
            <div className="inline-flex items-center rounded-full bg-[#2563eb] px-5 py-1.5 text-xs font-semibold tracking-[0.15em] uppercase text-white shadow">
              Welcome to BJMP-PMS
            </div>
            <h1 className="font-lexend max-w-md text-4xl leading-tight font-bold">
              Bureau of Jail Management{" "}
              <span className="text-[#60a5fa]">and Penology</span>
            </h1>
            <div className="flex flex-wrap gap-2 text-xs font-semibold">
              <span className="rounded-md bg-white/10 px-3 py-1.5 backdrop-blur">
                Visitor Portal
              </span>
              <span className="rounded-md bg-[#2563eb] px-3 py-1.5 shadow">
                Penology Management
              </span>
              <span className="rounded-md bg-white/10 px-3 py-1.5 backdrop-blur">
                Information System
              </span>
            </div>
          </div>

          {/* Description */}
          <div className="relative space-y-4">
            <p className="max-w-lg text-sm leading-7 text-blue-100">
              The BJMP Penology Management System is an integrated online platform that streamlines
              visitor registration, inmate records management, rehabilitation programs, and facility
              operations — promoting transparency, accountability, and efficient jail management.
            </p>
            <p className="text-xs text-blue-200/70">
              Bureau of Jail Management and Penology — Department of the Interior and Local
              Government
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

// ─── Login form ───────────────────────────────────────────────────────────────

function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const password = String(formData.get("password") ?? "");

    if (!email || !password) {
      toast.warning("Please enter your email and password.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.warning("Please enter a valid email address.");
      return;
    }

    try {
      setIsSubmitting(true);

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

      toast.success("Welcome back! Redirecting to your dashboard…");

      // Set session cookie (24 h)
      const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toUTCString();
      document.cookie = `bjmp_session=${encodeURIComponent(
        JSON.stringify({ role: "Visitor", email: userRecord.email, userId: userRecord.user_id })
      )}; path=/; expires=${expires}; SameSite=Lax`;

      onSuccess();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="flex flex-col gap-4" onSubmit={onSubmit} noValidate>
      <InputField
        id="email"
        label="Username or Email Address"
        type="email"
        placeholder="Enter your username/email"
        icon={<UserRound size={18} aria-hidden="true" />}
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
        <label className="inline-flex cursor-pointer items-center gap-2 text-[#5f6f8f]">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-[#cad4e8] accent-(--primary-accent)"
          />
          <span>Remember me</span>
        </label>
        <Dialog>
          <DialogTrigger
            className="cursor-pointer inline-flex items-center gap-1 font-semibold text-(--primary-accent) hover:underline"
          >
            Forgot password?
          </DialogTrigger>
          <DialogContent className="sm:max-w-md gap-3 overflow-hidden" showCloseButton={false}>
            {/* Decorative top gradient bar */}
            <div className="absolute inset-x-0 top-0 h-1.5 bg-linear-to-r from-amber-400 via-orange-400 to-amber-500" />

            <div className="flex flex-col items-center text-center px-2 pt-1">
              {/* Animated icon with layered rings */}
              <div className="relative">
                <span className="absolute inset-0 h-16 w-16 animate-ping rounded-full bg-amber-100 opacity-30" />
                <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-linear-to-br from-amber-100 to-orange-100 shadow-lg shadow-amber-200/40 ring-4 ring-white">
                  <Construction size={30} className="text-amber-500 drop-shadow-sm" aria-hidden="true" />
                </div>
              </div>

              {/* Status badge */}
              <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-linear-to-r from-amber-50 to-orange-50 px-3 py-1 text-xs font-bold tracking-wide uppercase text-amber-700 ring-1 ring-amber-200/80 shadow-sm">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
                </span>
                Coming Soon
              </div>

              <DialogHeader className="mt-2 items-center gap-1">
                <DialogTitle className="font-lexend text-lg tracking-tight text-[#1a2744]">
                  Forgot Password
                </DialogTitle>
                <DialogDescription className="max-w-xs text-[#5f6f8f] leading-relaxed">
                  The password recovery feature is currently under development and will be available soon.
                </DialogDescription>
              </DialogHeader>

              {/* Info card */}
              <div className="mt-2 w-full rounded-xl border border-blue-100 bg-blue-50/60 p-3 text-left">
                <p className="text-xs font-semibold text-blue-800">Need help right now?</p>
                <p className="mt-0.5 text-xs leading-relaxed text-blue-600">
                  Contact your facility administrator to reset your password manually.
                </p>
              </div>
            </div>

            <DialogFooter showCloseButton />
          </DialogContent>
        </Dialog>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="font-lexend flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#2563eb] px-4 py-3.5 text-base font-semibold text-white shadow-lg shadow-blue-500/25 transition hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-70"
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

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const username = String(formData.get("userName") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const password = String(formData.get("registerPassword") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    // ── Client-side validation ──
    if (!username || !email || !password || !confirmPassword) {
      toast.warning("Please fill in all fields before registering.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.warning("Please enter a valid email address.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match. Please try again.");
      return;
    }

    if (password.length < 6) {
      toast.warning("Password must be at least 6 characters long.");
      return;
    }

    try {
      setIsSubmitting(true);

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

      toast.success("Registration successful! You can now sign in to your account.");

      // Reset form fields
      (event.target as HTMLFormElement).reset();

      // Switch to login tab after a short delay so user can read the success message
      const redirectTimer = window.setTimeout(() => onSuccess(), 2000);
      return () => window.clearTimeout(redirectTimer);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="flex flex-col gap-4" onSubmit={onSubmit} noValidate>
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

      <button
        type="submit"
        disabled={isSubmitting}
        className="cursor-pointer font-lexend flex w-full items-center justify-center gap-2 rounded-xl bg-[#2563eb] px-4 py-3.5 text-base font-semibold text-white shadow-lg shadow-blue-500/25 transition hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-70"
      >
        <UserPlus size={18} aria-hidden="true" />
        {isSubmitting ? "Registering…" : "Register"}
      </button>
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
      <span className="font-lexend inline-flex items-center gap-1.5 text-[#1a2744]">
        {icon ? <span className="text-[#8191b3]">{icon}</span> : null}
        {label}
      </span>
      <div className="relative">
        <input
          id={id}
          name={id}
          type={resolvedType}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full rounded-xl border border-(--line) bg-(--surface-strong) px-4 py-3 text-[#2f3d5b] outline-none transition placeholder:text-[#9fa9bf] focus:border-(--primary-accent) focus:ring-2 focus:ring-[#c3d4f8] disabled:opacity-60"
          style={{
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