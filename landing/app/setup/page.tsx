import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Setup guide — SurfSimple",
  description: "Step-by-step guide to installing SurfSimple and setting up the optional voice features.",
};

export default function Setup() {
  return (
    <div className="py-16 px-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-extrabold text-blue-900 mb-4">Setup guide</h1>
        <p className="text-xl text-gray-600 mb-14">
          Follow these steps to get SurfSimple working. The basic setup takes under a minute.
        </p>

        {/* Step 1 */}
        <section className="mb-14">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <span className="w-10 h-10 rounded-full bg-blue-700 text-white text-lg font-bold flex items-center justify-center flex-shrink-0">1</span>
            Install the extension
          </h2>
          <ol className="flex flex-col gap-4 pl-14">
            <li className="text-lg text-gray-700">
              Go to the{" "}
              <a
                href="https://chrome.google.com/webstore"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-700 underline font-medium"
              >
                SurfSimple page on the Chrome Web Store
              </a>
              .
            </li>
            <li className="text-lg text-gray-700">Click the blue <strong>"Add to Chrome"</strong> button.</li>
            <li className="text-lg text-gray-700">
              A small window will ask "Add SurfSimple?" — click <strong>"Add extension"</strong>.
            </li>
            <li className="text-lg text-gray-700">
              The SurfSimple icon will appear in the top-right of your Chrome browser.
            </li>
          </ol>
        </section>

        {/* Step 2 */}
        <section className="mb-14">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <span className="w-10 h-10 rounded-full bg-blue-700 text-white text-lg font-bold flex items-center justify-center flex-shrink-0">2</span>
            Open the assistant panel
          </h2>
          <ol className="flex flex-col gap-4 pl-14">
            <li className="text-lg text-gray-700">
              Navigate to any website (for example, your online banking or a news site).
            </li>
            <li className="text-lg text-gray-700">
              Click the <strong>SurfSimple icon</strong> in the Chrome toolbar. A panel will slide open on the right side of your screen.
            </li>
            <li className="text-lg text-gray-700">
              You can now press <strong>"Summarise this page"</strong> or type a question in the box at the bottom.
            </li>
          </ol>
        </section>

        {/* Step 3 */}
        <section className="mb-14" id="elevenlabs">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <span className="w-10 h-10 rounded-full bg-blue-700 text-white text-lg font-bold flex items-center justify-center flex-shrink-0">3</span>
            Optional: set up the AI voice assistant
          </h2>
          <p className="text-lg text-gray-600 mb-6 pl-14">
            For natural-sounding voice responses, add a free ElevenLabs API key. This step is optional — the extension works without it using your browser&apos;s built-in voice.
          </p>
          <ol className="flex flex-col gap-4 pl-14">
            <li className="text-lg text-gray-700">
              Go to{" "}
              <a
                href="https://elevenlabs.io"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-700 underline font-medium"
              >
                elevenlabs.io
              </a>{" "}
              and create a free account.
            </li>
            <li className="text-lg text-gray-700">
              Once logged in, click your profile photo → <strong>API Keys</strong> → <strong>Create API key</strong>. Copy the key.
            </li>
            <li className="text-lg text-gray-700">
              In Chrome, click the SurfSimple icon → open the panel → click the <strong>Settings (⚙)</strong> button.
            </li>
            <li className="text-lg text-gray-700">
              Paste your ElevenLabs API key into the <strong>"ElevenLabs API key"</strong> field and click <strong>Save</strong>.
            </li>
            <li className="text-lg text-gray-700">
              Press the <strong>Preview</strong> button to confirm the voice is working.
            </li>
          </ol>
        </section>

        {/* Troubleshooting */}
        <section className="p-8 bg-yellow-50 rounded-2xl border border-yellow-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Troubleshooting</h2>
          <dl className="flex flex-col gap-6">
            {[
              {
                q: 'The panel says "Proxy URL not configured"',
                a: "The assistant service is not yet set up. Contact SurfSimple support.",
              },
              {
                q: "The microphone button does not work",
                a: "Chrome needs microphone permission for the extension. The panel will show a settings link — click it and set Microphone to Allow, then reload the page.",
              },
              {
                q: "The voice preview returns an error",
                a: "Double-check that your ElevenLabs API key is pasted correctly with no extra spaces.",
              },
              {
                q: 'The summary says "Assistant unavailable"',
                a: "Check your internet connection. If it is connected, the assistant service may be temporarily down — try again in a few minutes.",
              },
            ].map((item) => (
              <div key={item.q}>
                <dt className="text-lg font-bold text-gray-900 mb-1">{item.q}</dt>
                <dd className="text-lg text-gray-600">{item.a}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    </div>
  );
}
