import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-auto">
      <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-6 text-gray-600 text-sm">
        <p className="font-semibold text-blue-800 text-base">SurfSimple</p>
        <nav className="flex flex-wrap gap-6 justify-center">
          <Link href="/how-it-works" className="hover:text-blue-700 transition-colors">How it works</Link>
          <Link href="/pricing" className="hover:text-blue-700 transition-colors">Pricing</Link>
          <Link href="/setup" className="hover:text-blue-700 transition-colors">Setup</Link>
          <Link href="/privacy" className="hover:text-blue-700 transition-colors">Privacy</Link>
        </nav>
        <p>&copy; {new Date().getFullYear()} SurfSimple. All rights reserved.</p>
      </div>
    </footer>
  );
}
