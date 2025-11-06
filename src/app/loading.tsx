import Image from "next/image";

export default function Loading() {
  return (
    <div className="relative h-full w-full">
      <div className="fixed inset-0 -z-10">
        <Image
          src="/TFH/Tinder-for-Horses-background.png"
          alt="Second Horse Dating background"
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-black/60" />
      </div>
      <div className="relative z-10 flex h-full w-full items-center justify-center text-white">
        <div className="flex flex-col items-center gap-4">
          <div
            className="h-12 w-12 animate-spin rounded-full border-2 border-white/30 border-t-white"
            aria-hidden="true"
          />
          <p className="text-sm text-neutral-200">Saddling up your matches...</p>
        </div>
      </div>
    </div>
  );
}
