import Link from "next/link";
import Image from "next/image";

export default function NotFound() {
  return (
    <div className="min-h-[calc(100dvh-var(--footer-height,3rem))] flex items-center justify-center p-6">
      <div className="relative max-w-2xl w-full rounded-2xl border border-yellow-700/40 bg-yellow-900/10 text-yellow-50 overflow-hidden shadow-lg">
        <div className="absolute inset-0 pointer-events-none select-none opacity-30">
          <Image src="/TFH/horse_partying.png" alt="Lost horse partying" fill className="object-cover" suppressHydrationWarning />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>
        <div className="relative p-6 sm:p-8 space-y-4">
          <h1 className="text-3xl font-extrabold drop-shadow">404 — Pasture Not Found</h1>
          <p className="text-yellow-100/90">
            Whoa there! This horse trotted off the beaten trail and couldn’t find the page you’re looking for.
          </p>
          <ul className="list-disc pl-5 text-yellow-100/90 space-y-1">
            <li>Check the reins (URL) for typos.</li>
            <li>Gallop back to the home pasture.</li>
            <li>Bring snacks. Horses love snacks.</li>
          </ul>
          <div className="pt-2">
            <Link href="/" className="inline-block rounded-lg bg-yellow-500 text-black font-semibold px-4 py-2 hover:bg-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-300">
              Return to Stable
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
