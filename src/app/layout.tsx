import type { Metadata } from "next";
import { Baloo_2, Nunito } from "next/font/google";
import "./globals.css";

// next/font self-hosts these at build time (unlike the original app's Google
// Fonts <link> tags), which is what makes the offline-first requirement hold
// for typography too - no runtime request to fonts.googleapis.com.
const baloo2 = Baloo_2({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-baloo",
});

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-nunito",
});

export const metadata: Metadata = {
  title: "Scholarship Quest",
  description: "Cari beasiswa yang cocok sama profil kamu dari database beasiswamu sendiri.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className={`${baloo2.variable} ${nunito.variable}`}>
      <body>{children}</body>
    </html>
  );
}
