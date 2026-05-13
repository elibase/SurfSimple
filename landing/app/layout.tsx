import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Nav from "./components/Nav";
import Footer from "./components/Footer";
import "./globals.css";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SurfSimple — Web companion for seniors",
  description:
    "SurfSimple helps seniors navigate any website with voice prompts, plain-language summaries, and guided element highlighting.",
  openGraph: {
    title: "SurfSimple",
    description: "A web companion for seniors — voice, summaries, and guidance on any site.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} scroll-smooth`}>
      <body className="min-h-screen flex flex-col bg-white text-gray-900 font-sans antialiased">
        <Nav />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
