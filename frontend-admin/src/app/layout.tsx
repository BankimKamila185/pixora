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
  title: "Pixora | Analytics & Recommendation Dashboard",
  description: "Enterprise SaaS dashboard for monitoring Pixora recommendation algorithms, auditing content, and displaying user engagement analytics.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full bg-background dark">
      <body className={`${geistSans.variable} ${geistMono.variable} min-h-full flex flex-col antialiased text-foreground`}>
        {children}
      </body>
    </html>
  );
}
