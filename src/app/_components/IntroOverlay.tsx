"use client";

import React, { useEffect, useState } from "react";

export default function IntroOverlay() {
  const [show, setShow] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setShow(false), 600);
    return () => clearTimeout(t);
  }, []);
  if (!show) return null;
  return (
    <div className="pointer-events-none absolute inset-0 z-20 bg-black/50 animate-fade-out" aria-hidden>
      {/* simple fade overlay */}
    </div>
  );
}

