import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy policy — SurfSimple",
  description: "How SurfSimple handles your data — what is sent, where, and how to control it.",
};

export default function Privacy() {
  return (
    <div className="py-16 px-6">
      <div className="max-w-3xl mx-auto prose prose-lg max-w-none">
        <h1 className="text-4xl md:text-5xl font-extrabold text-blue-900 mb-4 not-prose">
          Privacy policy
        </h1>
        <p className="text-gray-500 mb-10 not-prose">Last updated: April 2025</p>

        <div className="flex flex-col gap-12 not-prose">

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Summary</h2>
            <ul className="flex flex-col gap-3">
              {[
                "SurfSimple does not collect or store any personal information.",
                "Page content is sent to AI services only when you press a button or speak a question.",
                "Your API keys are stored locally in your browser and never sent to SurfSimple servers.",
                "No data is retained on any server beyond the time needed to generate a response.",
              ].map((item) => (
                <li key={item} className="flex gap-3 text-lg text-gray-700">
                  <span className="text-green-600 font-bold flex-shrink-0">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">What data SurfSimple collects</h2>
            <p className="text-lg text-gray-700 leading-relaxed">
              SurfSimple does not run any analytics, tracking pixels, or data collection of its own. The extension stores only your settings (API key, voice preferences, font size) in <strong>Chrome&apos;s local storage</strong> on your device. This data never leaves your browser unless you explicitly initiate an action (see below).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">When page content is sent to third-party services</h2>
            <p className="text-lg text-gray-700 leading-relaxed mb-6">
              SurfSimple sends page content to external AI services <strong>only when you take an explicit action</strong>:
            </p>
            <div className="flex flex-col gap-6">
              {[
                {
                  title: 'Pressing "Summarise this page"',
                  body: "The text content of the current page is sent to the SurfSimple proxy server, which forwards it to Google Vertex AI (Gemma model) to generate a summary. The proxy does not log page content.",
                },
                {
                  title: "Typing or speaking a question",
                  body: "Your question and the current page's text and interactive element list are sent to the SurfSimple proxy server and forwarded to Google Vertex AI for an answer.",
                },
                {
                  title: "Using the voice assistant (ElevenLabs)",
                  body: "If you have added an ElevenLabs API key and press the microphone button, your voice audio is streamed directly from your browser to ElevenLabs' servers. ElevenLabs handles speech recognition, reasoning, and voice response. SurfSimple never receives or stores your audio. See the ElevenLabs privacy policy for details.",
                },
                {
                  title: "Text-to-speech responses",
                  body: "If you have an ElevenLabs API key, AI text responses are sent to ElevenLabs to be spoken aloud. Without an ElevenLabs key, your browser's built-in text-to-speech is used instead and no data leaves your device.",
                },
              ].map((item) => (
                <div key={item.title} className="p-6 bg-gray-50 rounded-xl border border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-lg text-gray-600 leading-relaxed">{item.body}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Third-party services</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-base">
                <thead>
                  <tr className="border-b-2 border-gray-300">
                    <th className="py-3 pr-6 font-bold text-gray-900">Service</th>
                    <th className="py-3 pr-6 font-bold text-gray-900">Purpose</th>
                    <th className="py-3 font-bold text-gray-900">Privacy policy</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {[
                    { name: "Google Vertex AI", purpose: "Page summarisation and Q&A (via SurfSimple proxy)", url: "https://cloud.google.com/terms/cloud-privacy-notice", label: "Google Cloud" },
                    { name: "ElevenLabs", purpose: "AI voice agent and text-to-speech (only if you add an API key)", url: "https://elevenlabs.io/privacy", label: "ElevenLabs" },
                  ].map((row) => (
                    <tr key={row.name}>
                      <td className="py-3 pr-6 font-medium text-gray-900">{row.name}</td>
                      <td className="py-3 pr-6 text-gray-600">{row.purpose}</td>
                      <td className="py-3">
                        <a href={row.url} target="_blank" rel="noopener noreferrer" className="text-blue-700 underline">
                          {row.label}
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Your API key security</h2>
            <p className="text-lg text-gray-700 leading-relaxed">
              Your ElevenLabs API key is stored using <strong>Chrome&apos;s local storage</strong> on your device. It is never sent to SurfSimple servers and is only read by the extension when you initiate a voice action. Content scripts that run inside web pages cannot access your API key — it is only accessible to the extension&apos;s background service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact</h2>
            <p className="text-lg text-gray-700 leading-relaxed">
              If you have any questions about this privacy policy, please open an issue on the{" "}
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-700 underline"
              >
                SurfSimple GitHub repository
              </a>
              .
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}
