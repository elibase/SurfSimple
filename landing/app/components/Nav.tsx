"use client";
import Link from "next/link";
import { useState } from "react";

const links = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/pricing", label: "Pricing" },
  { href: "/setup", label: "Setup" },
  { href: "/privacy", label: "Privacy" },
];

export default function Nav() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold text-blue-800 tracking-tight">
          SurfSimple
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-base font-medium text-gray-700 hover:text-blue-700 transition-colors"
            >
              {l.label}
            </Link>
          ))}
          <a
            href="https://chrome.google.com/webstore"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-4 px-5 py-2 rounded-full bg-blue-700 text-white font-semibold text-base hover:bg-blue-800 transition-colors"
          >
            Add to Chrome
          </a>
        </nav>

        {/* Mobile menu button */}
        <button
          className="md:hidden p-2 text-gray-700"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          onClick={() => setMenuOpen((v) => !v)}
        >
          {menuOpen ? (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-gray-200 px-6 py-4 flex flex-col gap-4 bg-white">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-lg font-medium text-gray-800"
              onClick={() => setMenuOpen(false)}
            >
              {l.label}
            </Link>
          ))}
          <a
            href="https://chrome.google.com/webstore"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 px-5 py-3 rounded-full bg-blue-700 text-white font-semibold text-lg text-center"
          >
            Add to Chrome
          </a>
        </div>
      )}
    </header>
  );
}
