"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export default function VisitorSplashScreen({ isReady }: { isReady?: boolean }) {
  const [internalReady, setInternalReady] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setInternalReady(true);
    }, 2500);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  const systemReady = isReady ?? internalReady;

  return (
    <div className="fixed inset-0 z-9999 flex min-h-dvh items-center justify-center overflow-hidden bg-[linear-gradient(180deg,#0b1422_0%,#14263f_55%,#1f364f_100%)] px-6">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-sky-300/10 blur-3xl" />
        <div className="absolute left-1/2 top-1/2 h-120 w-120 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-200/8 blur-3xl" />
      </div>

      <div className="relative z-10 flex w-full max-w-lg flex-col items-center text-center">
        <div className="relative flex items-center justify-center">
          <div
            className={`absolute h-56 w-56 rounded-full blur-2xl transition-all duration-1000 ${
              systemReady ? "bg-emerald-300/20" : "bg-sky-300/20"
            }`}
          />

          <div className="logo-wrap relative h-20 w-20 sm:h-28 sm:w-28">
            <Image
              src="/img/logo/logo.png"
              alt="BJMP Logo"
              fill
              priority
              sizes="(max-width:640px) 80px,112px"
              className="object-contain"
            />
          </div>
        </div>

        <div className="relative mb-6 mt-1 flex flex-col items-center" aria-hidden="true">
          <div className="relative mt-4 flex gap-1.5">
            {[...Array(5)].map((_, i) => (
              <div
                key={`bar-${i}`}
                className={`animate-bar-pulse h-14 w-1.5 rounded-full transition-colors duration-700 ${
                  systemReady ? "bg-emerald-300/75" : "bg-slate-300/55"
                }`}
                style={{ animationDelay: `${i * 0.12}s` }}
              />
            ))}
          </div>

          <svg width="54" height="54" viewBox="0 0 54 54" className="mt-3 animate-shield-breathe">
            <path
              d="M27 4l17 7v13c0 11.4-6.7 21.6-17 26-10.3-4.4-17-14.6-17-26V11l17-7z"
              fill={systemReady ? "rgba(16,185,129,0.18)" : "rgba(148,163,184,0.14)"}
              stroke={systemReady ? "#34d399" : "rgba(148,163,184,0.52)"}
              strokeWidth="1.5"
              className="transition-all duration-700"
            />
            <path
              d="M19 27l5.5 5.5L35 21"
              fill="none"
              stroke={systemReady ? "#34d399" : "rgba(148,163,184,0.64)"}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-all duration-700"
            />
          </svg>
        </div>

        <p className="font-inter text-xs uppercase tracking-[0.22em] text-cyan-100/70">
          Bureau of Jail Management and Penology
        </p>
        <h1 className="font-lexend mt-2 text-2xl font-bold text-slate-100 sm:text-3xl">
          Visitor Access Portal
        </h1>
        <p
          className={`font-inter mt-2 text-sm italic transition-colors duration-700 ${
            systemReady ? "text-emerald-200/85" : "text-sky-100/70"
          }`}
        >
          Safe Visits • Secure Access • Community Connection
        </p>
      </div>

      <div className="font-inter absolute bottom-8 text-xs text-cyan-100/55">
        BJMP Visitor Portal v1.0
      </div>

      <style jsx>{`
        .logo-wrap {
          animation: logo-float 2.8s ease-in-out infinite;
        }

        @keyframes logo-float {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-7px);
          }
        }

        @keyframes bar-pulse {
          0% {
            transform: translateY(0) scaleY(0.85);
            opacity: 0.45;
          }
          50% {
            transform: translateY(-4px) scaleY(1.05);
            opacity: 1;
          }
          100% {
            transform: translateY(0) scaleY(0.9);
            opacity: 0.65;
          }
        }

        .animate-bar-pulse {
          animation: bar-pulse 1.4s ease-in-out infinite;
        }

        @keyframes shield-breathe {
          0%,
          100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.03);
          }
        }

        .animate-shield-breathe {
          animation: shield-breathe 2.2s ease-in-out infinite;
        }

        @media (max-width: 640px) {
          .logo-wrap {
            height: 5rem;
            width: 5rem;
          }
        }
      `}</style>
    </div>
  );
}
