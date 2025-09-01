"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import type { Horse } from "./_lib/horses";

type Props = { horses: Horse[] };

export default function TinderApp({ horses }: Props) {
  const deck = useMemo(() => horses ?? [], [horses]);
  const [index, setIndex] = useState(0);
  const [likes, setLikes] = useState<Horse[]>([]);

  const current = deck[index];

  const onAction = (liked: boolean) => {
    if (current && liked) setLikes((l) => [...l, current]);
    setIndex((i) => Math.min(i + 1, deck.length));
  };

  if (!deck.length) {
    return (
      <div className="flex h-full items-center justify-center text-center p-6">
        <div>
          <h1 className="text-2xl font-semibold">Second Horse Dating</h1>
          <p className="mt-2 text-neutral-300">No horses available yet. Try adding a DATABASE_URL or use the mock data.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full flex items-center justify-center p-4">
      {current ? (
        <div className="relative w-full max-w-md bg-neutral-900/70 border border-neutral-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="relative h-80 w-full">
            <Image
              src={current.image}
              alt={`${current.name} profile photo`}
              fill
              className="object-cover"
              priority
            />
          </div>
          <div className="p-4">
            <h2 className="text-xl font-semibold text-white">
              {current.name} <span className="text-neutral-400">· {current.age}</span>
            </h2>
            <p className="text-sm text-neutral-300 mt-1">
              {current.breed} · {current.gender} · {Math.round(current.heightCm)} cm · {current.location}
            </p>
            {current.description && (
              <p className="text-sm text-neutral-300 mt-3">{current.description}</p>
            )}
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => onAction(false)}
                className="flex-1 py-2 rounded-lg border border-neutral-800 bg-neutral-900 text-neutral-200 hover:bg-neutral-800"
              >
                Pass
              </button>
              <button
                onClick={() => onAction(true)}
                className="flex-1 py-2 rounded-lg border border-pink-500 bg-pink-600 text-white hover:bg-pink-500"
              >
                Like
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center text-neutral-200">
          <h2 className="text-xl font-semibold">No more horses</h2>
          <p className="text-neutral-400 mt-1">You liked {likes.length} {likes.length === 1 ? "horse" : "horses"}.</p>
        </div>
      )}
    </div>
  );
}

