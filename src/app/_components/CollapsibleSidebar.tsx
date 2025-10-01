"use client";

import React from "react";
import Link from "next/link";
import { useTfhUI } from "@/lib/tfh";

type CollapsibleSidebarProps = {
  linkUrl: string;
  linkText?: string;
  title?: string;
  className?: string;
  description?: React.ReactNode;
  footer?: React.ReactNode; // Shown just above the link list
  hideMobileToggle?: boolean; // Hide floating mobile toggle (TFH uses footer button instead)
};

export default function CollapsibleSidebar({
  linkUrl,
  linkText = "Scrum board & changelog",
  title = "Project info",
  className = "",
  description,
  footer,
  hideMobileToggle = false,
}: CollapsibleSidebarProps) {
  const { projectInfoOpen, setProjectInfoOpen } = useTfhUI();
  const collapsed = !projectInfoOpen;

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      if (window.matchMedia && window.matchMedia("(min-width: 768px)").matches) {
        setProjectInfoOpen(true);
      }
    }
  }, [setProjectInfoOpen]);

  return (
    <>
      {/* Desktop sidebar (inline) */}
      <aside
        className={[
          "relative hidden md:block shrink-0 border-r border-neutral-800 bg-neutral-900/80 text-neutral-100 backdrop-blur",
          "h-[calc(100dvh-var(--footer-height,3rem))] overflow-hidden",
          "transition-[width] duration-200 ease-in-out",
          collapsed ? "md:w-12" : "md:w-80",
          className,
        ].join(" ")}
      >
        <div className="flex h-full flex-col">
          <div
            className={`border-b border-neutral-800 bg-neutral-900/80 px-3 py-2 ${
              collapsed ? "flex flex-col items-center gap-1" : "flex items-center justify-between gap-2"
            }`}
          >
            {!collapsed && (
              <span className="truncate text-sm font-medium text-neutral-200">{title}</span>
            )}
            <button
              type="button"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              onClick={() => setProjectInfoOpen(!projectInfoOpen)}
              className="rounded border border-neutral-700 bg-neutral-800 px-2 py-1 text-xs text-neutral-200 hover:bg-neutral-700"
            >
              {collapsed ? "<" : ">"}
            </button>
            {collapsed && (
              <div className="flex items-center justify-center gap-1 mt-1">
                <span aria-hidden className="text-sm">ℹ️</span>
              </div>
            )}
          </div>

          <nav className="flex-1 overflow-hidden px-4 py-4 pb-24 md:pb-32">
            {description && (
              <div className={`mb-3 ${collapsed ? "hidden" : "block"}`}>
                {typeof description === "string" ? (
                  <p className="text-xs leading-relaxed text-neutral-300">{description}</p>
                ) : (
                  description
                )}
              </div>
            )}
            {footer && (
              <div className={`mb-2 ${collapsed ? "hidden" : "block"}`}>
                {typeof footer === "string" ? (
                  <p className="text-[11px] leading-relaxed text-neutral-400">{footer}</p>
                ) : (
                  footer
                )}
              </div>
            )}
            <ul className="space-y-2">
              <li>
                <Link
                  href={linkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full items-center gap-2 rounded px-2 py-2 text-sm text-neutral-200 hover:bg-neutral-800 hover:text-white"
                >
                  <span className={`truncate ${collapsed ? "hidden" : "block"}`}>
                    {linkText}
                  </span>
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </aside>

      {/* Mobile: floating toggle + slide-in drawer */}
      {/* Toggle button */}
      {!hideMobileToggle && collapsed && (
        <button
          type="button"
          aria-label="Open project info"
          onClick={() => setProjectInfoOpen(true)}
          className="md:hidden fixed bottom-4 right-4 z-[1000] rounded-full border border-neutral-700 bg-neutral-900/90 px-4 py-2 text-sm text-neutral-100 shadow-lg backdrop-blur hover:bg-neutral-800"
        >
          Project info
        </button>
      )}

      {/* Backdrop */}
      {!collapsed && (
        <div
          className="md:hidden fixed left-0 right-0 bottom-0 top-0 z-40 bg-black/50"
          onClick={() => setProjectInfoOpen(false)}
        />
      )}

      {/* Drawer */}
      <aside
        className={[
          "md:hidden fixed z-50 left-0 top-0 h-[calc(100dvh-var(--footer-height,3rem))] w-[85vw] max-w-sm",
          "border-r border-neutral-800 bg-neutral-900/95 text-neutral-100 backdrop-blur",
          "transition-transform duration-200 ease-in-out",
          collapsed ? "-translate-x-full" : "translate-x-0",
        ].join(" ")}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between gap-2 border-b border-neutral-800 bg-neutral-900/95 px-4 py-3 pt-4">
            <span className="truncate text-sm font-medium text-neutral-200">{title}</span>
            <button
              type="button"
              aria-label="Close project info"
              onClick={() => setProjectInfoOpen(false)}
              className="rounded border border-neutral-700 bg-neutral-800 px-2 py-1 text-xs text-neutral-200 hover:bg-neutral-700"
            >
              Close
            </button>
          </div>
          <nav className="flex-1 overflow-y-auto px-4 py-3">
            {description && (
              <div className="mb-3">
                {typeof description === "string" ? (
                  <p className="text-xs leading-relaxed text-neutral-300">{description}</p>
                ) : (
                  description
                )}
              </div>
            )}
            {footer && (
              <div className="mb-2">
                {typeof footer === "string" ? (
                  <p className="text-[11px] leading-relaxed text-neutral-400">{footer}</p>
                ) : (
                  footer
                )}
              </div>
            )}
            <ul className="space-y-2">
              <li>
                <Link
                  href={linkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full items-center gap-2 rounded px-2 py-2 text-sm text-neutral-200 hover:bg-neutral-800 hover:text-white"
                >
                  <span className="truncate">{linkText}</span>
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </aside>
    </>
  );
}
