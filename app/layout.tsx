import type { Metadata } from "next";
import { Inter, Rajdhani } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const rajdhani = Rajdhani({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-rajdhani",
  display: "swap",
});

export const metadata: Metadata = {
  title: "MLBB Draft — Counter & Win Rate Tool",
  description:
    "Fast draft companion for Mobile Legends: Bang Bang. Counter pick, win rate analysis, ban recommendations, and hero comparison.",
  keywords: ["MLBB", "Mobile Legends", "draft", "counter", "tier list", "ban"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${rajdhani.variable}`}>
      <body className="min-h-screen bg-background text-text-primary font-body antialiased">
        {children}
      </body>
    </html>
  );
}
