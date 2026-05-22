import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "How it works — SurfSimple",
  description: "A step-by-step walkthrough of how SurfSimple helps seniors navigate any website.",
};

const steps = [
  {
    n: "1",
    title: "Install SurfSimple from the Chrome Web Store",
    desc: 'Click “Add to Chrome” on the Chrome Web Store page. Chrome will ask you to confirm — click “Add extension”. The SurfSimple icon will appear in your toolbar. This takes under a minute and is completely free.',
  },
  {
    n: "2",
    title: "Open the assistant panel",
    desc: "Click the SurfSimple icon in your Chrome toolbar (top right of your browser). A panel slides open on the right side of your screen. It stays open as you browse, so you always have help close by.",
  },
  {
    n: "3",
    title: "Summarise the page",
    desc: 'Press "Summarise this page" and SurfSimple reads the page and gives you a short, clear summary in plain English — no technical words, no clutter. Great for news articles, government forms, or any page that feels overwhelming.',
  },
  {
    n: "4",
    title: "Ask a question",
    desc: 'Type your question in the box at the bottom — for example "Where do I log in?" or "How do I check my account balance?" SurfSimple answers in clear, friendly language.',
  },
  {
    n: "5",
    title: "Follow the highlight",
    desc: "If your question involves clicking something on the page, SurfSimple draws a pulsing blue ring around the exact button or link you need. Just look for the glow and click it. The ring disappears after 8 seconds.",
  },
  {
    n: "6",
    title: "Use your voice (optional)",
    desc: 'Press the microphone button and speak your question naturally — "How do I find my inbox?" SurfSimple transcribes your words and answers out loud. No typing needed.',
  },
];

export default function HowItWorks() {
  return (
    <div className="py-16 px-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-extrabold text-blue-900 mb-6">How SurfSimple works</h1>
        <p className="text-xl text-gray-600 mb-14">
          SurfSimple sits quietly in your browser and is ready whenever you need it. Here is exactly what happens when you use it.
        </p>

        <ol className="flex flex-col gap-12">
          {steps.map((s) => (
            <li key={s.n} className="flex gap-6">
              <span className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-700 text-white text-xl font-bold flex items-center justify-center mt-1">
                {s.n}
              </span>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{s.title}</h2>
                <p className="text-lg text-gray-600 leading-relaxed">{s.desc}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-16 p-8 bg-blue-50 rounded-2xl border border-blue-200">
          <h2 className="text-2xl font-bold text-blue-900 mb-3">Ready to try it?</h2>
          <p className="text-lg text-gray-700 mb-6">
            Install SurfSimple in under a minute. No account, no password, no credit card.
          </p>
          <a
            href="https://chrome.google.com/webstore"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-8 py-4 rounded-full bg-blue-700 text-white font-bold text-xl hover:bg-blue-800 transition-colors"
          >
            Add to Chrome — it&apos;s free
          </a>
        </div>
      </div>
    </div>
  );
}
