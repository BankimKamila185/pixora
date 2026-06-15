import { Inter, Outfit } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-inter",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata = {
  title: "Pixora | Discover What Matters to You",
  description: "Explore a personalized visual discovery feed of curated content, topics, and images tailored directly to your behavior and interests.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full dark no-scrollbar select-none bg-[#020204]">
      <body className={`${inter.variable} ${outfit.variable} font-sans min-h-full antialiased bg-[#020204] text-[#f0f0f5] no-scrollbar flex flex-col`}>
        <div className="w-full min-h-screen bg-[#020204] relative flex flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}

