"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  href: string;
  label: string;
  icon: (active: boolean) => React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  {
    href: "/",
    label: "Overview",
    icon: (active) => (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke={active ? "#1C2124" : "#68706C"}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect width="7" height="9" x="3" y="3" rx="1" />
        <rect width="7" height="5" x="14" y="3" rx="1" />
        <rect width="7" height="9" x="14" y="12" rx="1" />
        <rect width="7" height="5" x="3" y="16" rx="1" />
      </svg>
    ),
  },
  {
    href: "/redos",
    label: "Slow regex",
    icon: (active) => (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke={active ? "#1C2124" : "#68706C"}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="9" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
  {
    href: "/race",
    label: "Double redemption",
    icon: (active) => (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke={active ? "#1C2124" : "#68706C"}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
        <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
        <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
      </svg>
    ),
  },
  {
    href: "/dep",
    label: "Outdated package",
    icon: (active) => (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke={active ? "#1C2124" : "#68706C"}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m7.5 4.27 9 5.15" />
        <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
        <path d="m3.3 7 8.7 5 8.7-5" />
        <path d="M12 22V12" />
      </svg>
    ),
  },
  {
    href: "/findings",
    label: "Findings",
    icon: (active) => (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke={active ? "#1C2124" : "#68706C"}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    ),
  },
  {
    href: "/pipeline",
    label: "Pipeline",
    icon: (active) => (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke={active ? "#1C2124" : "#68706C"}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="6" x2="6" y1="3" y2="15" />
        <circle cx="18" cy="6" r="3" />
        <circle cx="6" cy="18" r="3" />
        <path d="M18 9a9 9 0 0 1-9 9" />
      </svg>
    ),
  },
  {
    href: "/evidence",
    label: "Evidence",
    icon: (active) => (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke={active ? "#1C2124" : "#68706C"}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" x2="8" y1="13" y2="13" />
        <line x1="16" x2="8" y1="17" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
  },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [labConnected, setLabConnected] = useState<boolean | null>(null);
  const [labLatency, setLabLatency] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;
    const labUrl = process.env.NEXT_PUBLIC_LAB_URL ?? "http://127.0.0.1:4000";

    const checkHealth = async () => {
      const t0 = performance.now();
      try {
        const res = await fetch(`${labUrl}/api/health`, {
          cache: "no-store",
          signal: AbortSignal.timeout(2000),
        });
        const elapsed = Math.round(performance.now() - t0);
        if (res.ok && mounted) {
          setLabConnected(true);
          setLabLatency(elapsed);
        } else if (mounted) {
          setLabConnected(false);
          setLabLatency(null);
        }
      } catch {
        if (mounted) {
          setLabConnected(false);
          setLabLatency(null);
        }
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 4000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#F5F6F3] text-[#1C2124]">
      {/* Desktop Left Rail (88px wide) */}
      <aside className="hidden md:flex flex-col w-[88px] min-h-screen border-r border-[#E4E7E2] bg-[#FFFFFF] shrink-0 sticky top-0 h-screen select-none">
        <div className="h-16 flex items-center justify-center border-b border-[#E4E7E2]">
          <Link
            href="/"
            className="font-display text-xl font-normal tracking-tight text-[#1C2124] hover:opacity-80 transition-opacity"
            title="Proofline Home"
          >
            P
          </Link>
        </div>

        <nav className="flex-1 py-4 flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative group flex flex-col items-center justify-center py-3 px-1 text-center transition-colors ${
                  active
                    ? "text-[#1C2124]"
                    : "text-[#68706C] hover:text-[#1C2124]"
                }`}
              >
                {active && (
                  <span className="absolute left-0 top-2 bottom-2 w-[2px] bg-[#1C2124]" />
                )}
                <div className="w-6 h-6 flex items-center justify-center mb-1">
                  {item.icon(active)}
                </div>
                <span className="text-[10px] leading-tight font-sans font-medium">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="h-16 border-b border-[#E4E7E2] bg-[#FFFFFF] px-6 flex items-center justify-between shrink-0 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="font-display text-[22px] tracking-tight font-normal text-[#1C2124]"
            >
              Proofline
            </Link>
            <span className="text-[#E4E7E2] hidden sm:inline">/</span>
            <span className="text-[13px] font-sans text-[#68706C] hidden sm:inline">
              Empirical Security Flaws & Remediations
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Lab Server Status Pill */}
            <div
              className="flex items-center gap-2 text-xs font-sans px-3 py-1.5 rounded-full border border-[#E4E7E2] bg-[#F5F6F3]"
              title={
                labConnected
                  ? `Lab server running at 127.0.0.1:4000 (${labLatency}ms)`
                  : "Lab server not detected on 127.0.0.1:4000"
              }
            >
              <span
                className={`w-2 h-2 rounded-full transition-colors ${
                  labConnected === true
                    ? "bg-[#1E4B3C]"
                    : labConnected === false
                    ? "bg-[#7A1F33]"
                    : "border border-[#68706C]"
                }`}
              />
              <span className="text-[#1C2124] font-medium text-[12px]">
                {labConnected === true
                  ? `Lab :4000 (${labLatency}ms)`
                  : labConnected === false
                  ? "Lab offline"
                  : "Connecting..."}
              </span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 px-4 sm:px-8 py-8 max-w-[1280px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
