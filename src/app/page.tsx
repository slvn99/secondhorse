export default function HomePage() {
  return (
    <main className="mx-auto max-w-3xl p-8">
      <h1 className="text-2xl font-semibold mb-2">Welcome to Next.js 15</h1>
      <p className="text-zinc-400">Project scaffold is ready with Tailwind.</p>
      <ul className="mt-4 space-y-1 list-disc list-inside text-zinc-300">
        <li>
          Route: <code className="bg-zinc-900 rounded px-1">/</code>
        </li>
        <li>
          API: <code className="bg-zinc-900 rounded px-1">/api/health</code>
        </li>
      </ul>
      <div className="mt-6 inline-flex gap-3">
        <a
          className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500"
          href="https://tailwindcss.com/docs"
          target="_blank"
          rel="noreferrer"
        >
          Tailwind Docs
        </a>
        <a
          className="rounded-md border border-zinc-700 px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-900"
          href="https://nextjs.org/docs"
          target="_blank"
          rel="noreferrer"
        >
          Next.js Docs
        </a>
      </div>
    </main>
  );
}
