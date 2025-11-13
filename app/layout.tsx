import type { Metadata } from "next";
import {
  DM_Sans as DMSans,
  Geist,
  Geist_Mono as GeistMono,
  Space_Grotesk as SpaceGrotesk,
} from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = GeistMono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const spaceGrotesk = SpaceGrotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const dmSans = DMSans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Nebula Studio — Text-to-Video Synthesizer",
  description:
    "Transform narrative prompts into stylized motion graphics directly in your browser with the Nebula Studio synthesizer.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${spaceGrotesk.variable} ${dmSans.variable} antialiased bg-black text-white`}
      >
        {children}
      </body>
    </html>
  );
}
