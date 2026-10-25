import type { Metadata } from "next";
import { Bodoni_Moda, Hanken_Grotesk, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { Shell } from "@/components/shell";

const bodoni = Bodoni_Moda({
  variable: "--font-bodoni",
  subsets: ["latin"],
  display: "swap",
});

const hanken = Hanken_Grotesk({
  variable: "--font-hanken",
  subsets: ["latin"],
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  weight: ["400", "500"],
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Proofline | Empirical Security Flaws and Remediations",
  description:
    "Empirical evidence of security flaws and their mitigations with live telemetry, CVSS v3.1 scoring, and regression proof.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${bodoni.variable} ${hanken.variable} ${plexMono.variable} h-full`}
    >
      <body className="min-h-full flex flex-col font-sans bg-[#F5F6F3] text-[#1C2124]">
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
