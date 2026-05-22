import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Pricing — SurfSimple",
  description: "SurfSimple is free to use. Optional ElevenLabs voice features require an API key.",
};

const freeFeatures = [
  "Ask questions on any page",
  "Plain-language page summaries",
  "On-screen element highlighting",
  "Voice input via your browser's built-in speech recognition",
  "Text-to-speech responses via your browser's built-in voice",
  "Works on any website",
  "No account required",
];

const proFeatures = [
  "Everything in Free",
  "AI voice assistant powered by ElevenLabs",
  "Natural-sounding spoken responses",
  "Real-time voice conversation — speak and listen without typing",
  "Your choice of voice (Rachel, Dorothy, Josh, Adam, Bella)",
  "Adjustable speaking speed",
];

export default function Pricing() {
  return (
    <div className="py-16 px-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-extrabold text-blue-900 text-center mb-4">
          Simple, honest pricing
        </h1>
        <p className="text-xl text-gray-600 text-center mb-14">
          SurfSimple is free. The optional voice upgrade uses your own ElevenLabs account.
        </p>

        <div className="grid md:grid-cols-2 gap-8 items-start">
          {/* Free tier */}
          <div className="rounded-2xl border-2 border-gray-200 p-8">
            <p className="text-base font-semibold text-blue-700 uppercase tracking-wide mb-2">Free forever</p>
            <div className="flex items-end gap-2 mb-6">
              <span className="text-5xl font-extrabold text-gray-900">£0</span>
              <span className="text-gray-500 text-lg mb-2">/ month</span>
            </div>
            <p className="text-gray-600 mb-8">
              All core features included. Uses your browser&apos;s built-in speech and voice — no API key needed.
            </p>
            <ul className="flex flex-col gap-3 mb-10">
              {freeFeatures.map((f) => (
                <li key={f} className="flex gap-3 text-lg text-gray-700">
                  <span className="text-green-600 font-bold flex-shrink-0">✓</span>
                  {f}
                </li>
              ))}
            </ul>
            <a
              href="https://chrome.google.com/webstore"
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center px-6 py-4 rounded-full border-2 border-blue-700 text-blue-700 font-bold text-xl hover:bg-blue-50 transition-colors"
            >
              Add to Chrome — free
            </a>
          </div>

          {/* Pro tier */}
          <div className="rounded-2xl border-2 border-blue-700 p-8 bg-blue-50 relative">
            <span className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-blue-700 text-white text-sm font-bold rounded-full">
              Best experience
            </span>
            <p className="text-base font-semibold text-blue-700 uppercase tracking-wide mb-2">Voice upgrade</p>
            <div className="flex items-end gap-2 mb-2">
              <span className="text-5xl font-extrabold text-gray-900">Your cost</span>
            </div>
            <p className="text-gray-600 text-base mb-6">
              Add your own{" "}
              <a
                href="https://elevenlabs.io/pricing"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-700 underline"
              >
                ElevenLabs API key
              </a>
              . ElevenLabs offers a free tier with 10,000 characters/month — enough for most users.
            </p>
            <ul className="flex flex-col gap-3 mb-10">
              {proFeatures.map((f) => (
                <li key={f} className="flex gap-3 text-lg text-gray-700">
                  <span className="text-blue-600 font-bold flex-shrink-0">✓</span>
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/setup#elevenlabs"
              className="block w-full text-center px-6 py-4 rounded-full bg-blue-700 text-white font-bold text-xl hover:bg-blue-800 transition-colors"
            >
              Set up voice upgrade
            </Link>
          </div>
        </div>

        <div className="mt-14 p-8 bg-gray-50 rounded-2xl border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Why does the voice upgrade need my own API key?</h2>
          <p className="text-lg text-gray-600 leading-relaxed">
            ElevenLabs voice generation is a paid service that charges by the amount of text spoken. Rather than hide this cost in a subscription, SurfSimple lets you bring your own key and pay only for what you use — or stay on the free tier where your browser&apos;s built-in voice handles everything at no cost.
          </p>
        </div>
      </div>
    </div>
  );
}
