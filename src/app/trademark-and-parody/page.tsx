import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Trademark & Parody Note – Second Horse Dating",
  description: "Disclaimer about trademarks, affiliations, and parody/satire intent.",
  alternates: { canonical: "/trademark-and-parody" },
  openGraph: {
    title: "Trademark & Parody – Second Horse Dating",
    description: "Disclaimer about trademarks, affiliations, and parody/satire intent.",
    images: [
      { url: "/TFH/tfh-og-image.png", width: 1200, height: 630, alt: "Second Horse Dating – trademark & parody" },
    ],
    url: "/trademark-and-parody",
  },
  twitter: {
    card: "summary_large_image",
    title: "Trademark & Parody – Second Horse Dating",
    description: "Disclaimer about trademarks, affiliations, and parody/satire intent.",
    images: ["/TFH/tfh-og-image.png"],
  },
};

const LAST_UPDATED =
  process.env.NEXT_PUBLIC_TRADEMARK_NOTE_LAST_UPDATED ?? "2025-02-25";

export default function TrademarkParodyPage() {
  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-6 pb-[calc(var(--footer-height,3rem)+2rem)] text-neutral-200">
        <div className="mb-3">
          <Link href="/" className="inline-flex items-center gap-2 rounded-md border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-sm text-neutral-200 hover:bg-neutral-700" aria-label="Home">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M12.97 2.97a1.5 1.5 0 0 0-1.94 0l-7 6a1.5 1.5 0 0 0-.53 1.14V20a2 2 0 0 0 2 2h4.5a.5.5 0 0 0 .5-.5V16a2 2 0 1 1 4 0v5.5a.5.5 0 0 0 .5.5H20a2 2 0 0 0 2-2v-9.89c0-.43-.19-.83-.53-1.1l-7.5-6.04z"/></svg>
            Home
          </Link>
        </div>
        <h1 className="text-2xl font-semibold">Trademark & Parody Note</h1>
        <p className="mt-2 text-sm text-neutral-400">Last updated: {LAST_UPDATED}</p>

        <section className="mt-6 space-y-3 text-sm leading-relaxed text-neutral-300">
          <p>
            Second Horse Dating is a playful demo and parody experience. It is not affiliated with, endorsed by, or sponsored by Tinder, Second Love, or any other dating apps, platforms, or companies.
          </p>
          <p>
            Any references to brand names or trademarks are for descriptive and satirical purposes only. All trademarks, service marks, and trade names belong to their respective owners.
          </p>
          <p>
            If you are a rights holder and have questions or concerns, please contact us and we will respond promptly.
          </p>
          <p>
            Contact: <a href="mailto:info@samvannoord.nl" className="underline hover:text-neutral-100">info@samvannoord.nl</a>
          </p>
        </section>
      </div>
    </div>
  );
}
