const PLACEHOLDER_ROWS = 6;

export default function Loading() {
  return (
    <div className="h-full w-full overflow-y-auto">
      <div className="mx-auto flex h-full w-full max-w-3xl flex-col gap-8 px-4 py-16 text-neutral-200">
        <div className="space-y-2 text-left">
          <div className="h-7 w-36 rounded-full bg-white/10" />
          <div className="h-4 w-64 max-w-full rounded-full bg-white/10" />
        </div>
        <div className="space-y-4 rounded-2xl border border-white/10 bg-black/40 p-6 shadow-2xl shadow-black/30 backdrop-blur">
          {Array.from({ length: PLACEHOLDER_ROWS }, (_, index) => (
            <div key={index} className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-sm font-semibold text-white/70">
                #{index + 1}
              </div>
              <div className="flex-1 space-y-2">
                <div className="h-4 w-1/2 rounded-full bg-white/10" />
                <div className="h-3 w-1/3 rounded-full bg-white/5" />
              </div>
              <div className="h-6 w-16 rounded-full bg-white/10" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
