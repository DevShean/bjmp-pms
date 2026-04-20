"use client";

import Image from "next/image";

export default function ServerTimeoutSplash() {
  return (
    <div className="fixed inset-0 z-9999 flex min-h-dvh items-center justify-center overflow-hidden bg-[linear-gradient(180deg,#0f0a0a_0%,#1a1212_55%,#261a1a_100%)] px-6">
      {/* Background Decorative Elements */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-500/10 blur-3xl animate-pulse" />
        <div className="absolute left-1/2 top-1/2 h-120 w-120 -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange-500/5 blur-3xl" />
        
        {/* Subtle Scanline Effect */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
             style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0) 50%, rgba(0,0,0,0.25) 50%), linear-gradient(90deg, rgba(255,0,0,0.06), rgba(0,255,0,0.02), rgba(0,0,255,0.06))', backgroundSize: '100% 2px, 3px 100%' }}></div>
      </div>

      <div className="relative z-10 flex w-full max-w-lg flex-col items-center text-center">
        <div className="relative flex items-center justify-center">
          {/* Pulsing Warning Glow */}
          <div className="absolute h-56 w-56 rounded-full blur-2xl bg-red-500/20 animate-warning-pulse" />

          <div className="logo-wrap relative h-20 w-20 sm:h-28 sm:w-28 grayscale contrast-125 opacity-80">
            <Image
              src="/img/logo/logo.png"
              alt="BJMP Logo"
              fill
              priority
              sizes="(max-width:640px) 80px,112px"
              className="object-contain"
            />
            {/* Red Overlay when "glitching" */}
            <div className="absolute inset-0 bg-red-500/10 mix-blend-overlay rounded-full" />
          </div>
        </div>

        <div className="relative mb-6 mt-1 flex flex-col items-center" aria-hidden="true">
          {/* Urgent Loading Bars */}
          <div className="relative mt-4 flex gap-1.5">
            {[...Array(5)].map((_, i) => (
              <div
                key={`bar-${i}`}
                className="animate-bar-pulse-urgent h-14 w-1.5 rounded-full bg-red-500/60"
                style={{ animationDelay: `${i * 0.1}s` }}
              />
            ))}
          </div>

          {/* Warning Icon/Shield */}
          <svg width="54" height="54" viewBox="0 0 54 54" className="mt-3 animate-warning-shake">
            <path
              d="M27 4l17 7v13c0 11.4-6.7 21.6-17 26-10.3-4.4-17-14.6-17-26V11l17-7z"
              fill="rgba(239, 68, 68, 0.1)"
              stroke="#ef4444"
              strokeWidth="2"
            />
            <path
              d="M27 16v12M27 36h.01"
              fill="none"
              stroke="#ef4444"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <p className="font-inter text-xs uppercase tracking-[0.22em] text-red-200/60">
          Bureau of Jail Management and Penology
        </p>
        
        <h1 className="font-lexend mt-2 text-2xl font-bold text-red-50 sm:text-3xl tracking-tight">
          SERVER TIME OUT
        </h1>
        
        <div className="mt-4 flex flex-col items-center gap-1">
          <p className="font-inter text-sm italic text-orange-200/80 animate-flicker">
            Connection Interrupted • Please pay due to restore access
          </p>
          <div className="h-px w-24 bg-linear-to-r from-transparent via-red-500/40 to-transparent mt-2"></div>
        </div>

        {/* Action Suggestion */}
        <p className="mt-8 font-inter text-[10px] text-slate-500 uppercase tracking-widest">
          Error Code: ERR_CONN_PAYMENT_REQUIRED
        </p>
      </div>

      <div className="font-inter absolute bottom-8 text-xs text-red-200/40">
        BJMP System Administrator Panel
      </div>

      <style jsx>{`
        .logo-wrap {
          animation: logo-float 3s ease-in-out infinite;
        }

        @keyframes logo-float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(1deg); }
        }

        @keyframes warning-pulse {
          0%, 100% { transform: scale(1); opacity: 0.2; }
          50% { transform: scale(1.1); opacity: 0.4; }
        }

        .animate-warning-pulse {
          animation: warning-pulse 2s ease-in-out infinite;
        }

        @keyframes bar-pulse-urgent {
          0%, 100% { transform: scaleY(0.8); opacity: 0.4; }
          50% { transform: scaleY(1.2); opacity: 1; }
        }

        .animate-bar-pulse-urgent {
          animation: bar-pulse-urgent 0.8s ease-in-out infinite;
        }

        @keyframes warning-shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-1px); }
          75% { transform: translateX(1px); }
        }

        .animate-warning-shake {
          animation: warning-shake 0.1s ease-in-out infinite;
        }

        @keyframes flicker {
          0%, 100% { opacity: 1; }
          41% { opacity: 1; }
          42% { opacity: 0.8; }
          43% { opacity: 1; }
          45% { opacity: 0.3; }
          46% { opacity: 1; }
        }

        .animate-flicker {
          animation: flicker 4s linear infinite;
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
