import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy – Second Horse Dating",
  description: "How we use cookies, analytics, and handle profile data.",
  alternates: { canonical: "/privacy" },
  openGraph: {
    title: "Privacy – Second Horse Dating",
    description: "How we use cookies, analytics, and handle profile data.",
    images: [
      { url: "/TFH/tfh-og-image.png", width: 1200, height: 630, alt: "Second Horse Dating – privacy" },
    ],
    url: "/privacy",
  },
  twitter: {
    card: "summary_large_image",
    title: "Privacy – Second Horse Dating",
    description: "How we use cookies, analytics, and handle profile data.",
    images: ["/TFH/tfh-og-image.png"],
  },
};

export default function PrivacyPage() {
  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-6 pb-[calc(var(--footer-height,3rem)+2rem)] text-neutral-200">
        <div className="mb-3">
          <Link href="/" className="inline-flex items-center gap-2 rounded-md border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-sm text-neutral-200 hover:bg-neutral-700" aria-label="Home">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M12.97 2.97a1.5 1.5 0 0 0-1.94 0l-7 6a1.5 1.5 0 0 0-.53 1.14V20a2 2 0 0 0 2 2h4.5a.5.5 0 0 0 .5-.5V16a2 2 0 1 1 4 0v5.5a.5.5 0 0 0 .5.5H20a2 2 0 0 0 2-2v-9.89c0-.43-.19-.83-.53-1.1l-7.5-6.04z"/></svg>
            Home
          </Link>
        </div>
        <h1 className="text-2xl font-semibold">Privacy Notice</h1>
        <p className="mt-2 text-sm text-neutral-400">Last updated: {new Date().toISOString().slice(0, 10)}</p>

        <section className="mt-6 space-y-3 text-sm leading-relaxed">
          <p>
            We use minimal cookies and privacy‑friendly analytics to keep the site functional and improve the experience. By using this site, you agree to this privacy notice.
          </p>

          <h2 className="text-lg font-semibold text-neutral-100 mt-4">What we collect</h2>
          <ul className="list-disc pl-5 space-y-1 text-neutral-300">
            <li>Basic usage data (page views, anonymized performance metrics).</li>
            <li>Cookie for consent and interface state (e.g., intro banner cooldown).</li>
            <li>Profile submission data you provide on the “Create Profile” form.</li>
          </ul>

          <h2 className="text-lg font-semibold text-neutral-100 mt-4">Profile submissions</h2>
          <p className="text-neutral-300">
            New profiles are reviewed by a human before publishing. Your submission (including text and image links) is stored in our database whether it is published or not, so we can review and moderate it. You can request removal at any time and we will delete it manually.
          </p>
          <p className="text-neutral-300 mt-2">
            For profile submissions we do not store your IP address in our database. Images may be uploaded or proxied via trusted providers (e.g., Vercel Blob/CDN).
          </p>

          <h2 className="text-lg font-semibold text-neutral-100 mt-4">hCaptcha</h2>
          <p className="text-neutral-300">
            We use hCaptcha to prevent abuse. For spam protection, hCaptcha may log your IP address and device/interaction data under their own privacy policy. Verification occurs during profile submission when enabled.
          </p>

          <h2 className="text-lg font-semibold text-neutral-100 mt-4">Analytics</h2>
          <p className="text-neutral-300">
            We use Vercel Analytics to understand usage. Your browsing data is analyzed by Vercel and by me (the site owner, Sam) to improve the experience. Data is aggregated and not used to personally identify you.
          </p>

          <h2 className="text-lg font-semibold text-neutral-100 mt-4">Data retention</h2>
          <p className="text-neutral-300">
            We retain submitted profiles (published or unpublished) and associated media as needed to operate and moderate the service. You can request removal by contacting us; removals are performed by hand.
          </p>

          <h2 className="text-lg font-semibold text-neutral-100 mt-4">Contact</h2>
          <p className="text-neutral-300">
            Email: <a href="mailto:info@samvannoord.nl" className="underline hover:text-neutral-100">info@samvannoord.nl</a>
          </p>
        </section>
      </div>
    </div>
  );
}
