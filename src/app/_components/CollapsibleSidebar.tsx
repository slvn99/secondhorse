"use client";

import React, { useState } from "react";

type Props = {
  linkUrl?: string;
  hideMobileToggle?: boolean;
  description?: React.ReactNode;
  footer?: React.ReactNode;
};

export default function CollapsibleSidebar({ linkUrl, hideMobileToggle, description, footer }: Props) {
  const [open, setOpen] = useState(true);
  return (
    <aside
      className="hidden lg:flex flex-col w-80 shrink-0 h-full border-l border-neutral-800 bg-neutral-950/60 backdrop-blur relative"
      aria-label="Info sidebar"
    >
      {!hideMobileToggle && (
        <button
          onClick={() => setOpen((o) => !o)}
          className="absolute -left-10 top-4 bg-neutral-900 border border-neutral-800 rounded-md px-2 py-1 text-xs"
        >
          {open ? "Hide" : "Show"}
        </button>
      )}
      <div className="p-4 overflow-y-auto flex-1">
        {description}
        {linkUrl && (
          <p className="text-xs mt-4">
            <a className="underline text-neutral-300" href={linkUrl} target="_blank" rel="noreferrer">
              Learn more
            </a>
          </p>
        )}
      </div>
      {footer && <div className="p-4 border-t border-neutral-800 text-neutral-400">{footer}</div>}
    </aside>
  );
}

