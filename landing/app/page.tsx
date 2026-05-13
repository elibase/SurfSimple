import Link from "next/link";

const features = [
  {
    icon: "📄",
    title: "Summarise any page",
    desc: "One tap turns any webpage into a short, plain-language summary — no jargon, no clutter.",
  },
  {
    icon: "💬",
    title: "Ask questions in plain English",
    desc: 'Type or say "Where do I sign in?" and SurfSimple answers clearly and points to the right button.',
  },
  {
    icon: "🔵",
    title: "Guided highlighting",
    desc: "A pulsing ring highlights the exact element you need so there is no guesswork about where to click.",
  },
];

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="bg-blue-50 py-20 px-6 text-center">
        <div className="max-w-3xl mx-auto animate-fade-up">
          <h1 className="text-5xl md:text-6xl font-extrabold text-blue-900 leading-tight mb-6">
            The web, made simple.
          </h1>
          <p className="text-xl md:text-2xl text-gray-700 mb-10">
            SurfSimple is a free Chrome extension that helps seniors navigate any website — with voice guidance, plain-language summaries, and on-screen highlights.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://chrome.google.com/webstore"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 rounded-full bg-blue-700 text-white font-bold text-xl hover:bg-blue-800 transition-colors shadow-md"
            >
              Add to Chrome — it&apos;s free
            </a>
            <Link
              href="/how-it-works"
              className="px-8 py-4 rounded-full border-2 border-blue-700 text-blue-700 font-bold text-xl hover:bg-blue-50 transition-colors"
            >
              See how it works
            </Link>
          </div>
        </div>
      </section>

      {/* Feature cards */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-14">
            Everything you need to browse with confidence
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((f) => (
              <div
                key={f.title}
                className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm"
              >
                <div className="text-5xl mb-5">{f.icon}</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">{f.title}</h3>
                <p className="text-lg text-gray-600 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quote */}
      <section className="bg-gray-50 py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <blockquote className="text-2xl md:text-3xl font-medium text-gray-800 italic leading-relaxed mb-8">
            &ldquo;I finally feel confident using the internet. SurfSimple explains everything in plain English and shows me exactly where to click.&rdquo;
          </blockquote>
          <p className="text-lg text-gray-500">— Margaret, 72</p>
        </div>
      </section>

      {/* Steps teaser */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-14">
            Up and running in three steps
          </h2>
          <ol className="grid md:grid-cols-3 gap-10 text-center">
            {[
              { n: "1", title: "Install the extension", desc: 'Click "Add to Chrome" — it takes under a minute.' },
              { n: "2", title: "Open the side panel", desc: "Click the SurfSimple icon in your Chrome toolbar to open the assistant panel." },
              { n: "3", title: "Ask anything", desc: 'Type or say your question — "How do I log in?" — and follow the on-screen guidance.' },
            ].map((s) => (
              <li key={s.n} className="flex flex-col items-center">
                <span className="w-14 h-14 rounded-full bg-blue-700 text-white text-2xl font-bold flex items-center justify-center mb-5">
                  {s.n}
                </span>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{s.title}</h3>
                <p className="text-lg text-gray-600">{s.desc}</p>
              </li>
            ))}
          </ol>
          <div className="text-center mt-14">
            <Link
              href="/setup"
              className="px-8 py-4 rounded-full bg-blue-700 text-white font-bold text-xl hover:bg-blue-800 transition-colors"
            >
              Full setup guide
            </Link>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-blue-700 py-20 px-6 text-center text-white">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-4xl font-extrabold mb-6">Ready to browse with confidence?</h2>
          <p className="text-xl mb-10 opacity-90">
            Free to install. No account required. Works on any website.
          </p>
          <a
            href="https://chrome.google.com/webstore"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-10 py-5 rounded-full bg-white text-blue-800 font-extrabold text-xl hover:bg-blue-50 transition-colors shadow-lg"
          >
            Add to Chrome — it&apos;s free
          </a>
        </div>
      </section>
    </>
  );
}
