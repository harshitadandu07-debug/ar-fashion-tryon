import type { Metadata } from "next";
import { Instrument_Serif, Instrument_Sans, Bricolage_Grotesque, Hanken_Grotesk } from "next/font/google";
import Script from "next/script";
import { Agentation } from "agentation";
import "./globals.css";

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-instrument-serif",
});

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-instrument-sans",
});

const bricolageGrotesque = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["700"],
  variable: "--font-bricolage",
});

const hankenGrotesk = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-hanken",
});

export const metadata: Metadata = {
  title: "Double Take",
  description: "WebAR Spring 2026 fashion try-on",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${instrumentSerif.variable} ${instrumentSans.variable} ${bricolageGrotesque.variable} ${hankenGrotesk.variable}`}>
      <body>
        {children}
        {process.env.NODE_ENV === "development" && <Agentation />}
        <Script
          src="https://cdn.jsdelivr.net/npm/mind-ar@1.2.5/dist/mindar-image-three.prod.js"
          strategy="beforeInteractive"
        />
        <Script
          src="https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js"
          strategy="beforeInteractive"
        />
      </body>
    </html>
  );
}
