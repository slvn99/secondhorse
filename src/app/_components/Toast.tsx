"use client";

import React from "react";

type Props = { message: string; type?: "success" | "error" | "info" };

export default function Toast({ message, type = "info" }: Props) {
  const colors =
    type === "success"
      ? "bg-green-600/90 border-green-500"
      : type === "error"
      ? "bg-red-600/90 border-red-500"
      : "bg-neutral-800/90 border-neutral-700";
  return (
    <div className={`pointer-events-none fixed top-4 right-4 z-50 rounded-md border px-3 py-2 text-sm text-white ${colors}`}>
      {message}
    </div>
  );
}

