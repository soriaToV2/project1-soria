import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "StellarCCT — Conditional Cash Transfer on Stellar",
  description:
    "Transparent, corruption-resistant social welfare transfers on Stellar. Funds release only when school attendance or health visits are confirmed on-chain via Soroban.",
  keywords: ["Stellar", "Soroban", "conditional cash transfer", "social welfare", "blockchain", "Philippines"],
  openGraph: {
    title: "StellarCCT — Conditional Cash Transfer",
    description: "Government social transfers, reimagined on Stellar. Zero leakage, zero corruption.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
