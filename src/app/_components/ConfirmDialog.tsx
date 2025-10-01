"use client";

import React, { useEffect, useRef } from "react";
import { useTfhUI } from "@/lib/tfh";

export default function ConfirmDialog({
  open,
  title = "Are you sure?",
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title?: string;
  message?: string | React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const { pushOverlay, popOverlay } = useTfhUI();
  const wasOpen = useRef(false);

  useEffect(() => {
    if (open && !wasOpen.current) {
      pushOverlay();
      wasOpen.current = true;
    } else if (!open && wasOpen.current) {
      popOverlay();
      wasOpen.current = false;
    }
    return () => {
      if (wasOpen.current) {
        popOverlay();
        wasOpen.current = false;
      }
    };
  }, [open, pushOverlay, popOverlay]);

  const containerRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!open) return;
    const node = containerRef.current;
    if (!node) return;
    const focusables = node.querySelectorAll<HTMLElement>('button, [href], [tabindex]:not([tabindex="-1"])');
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    first?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); onCancel(); }
      if (e.key !== 'Tab' || !focusables.length) return;
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
    };
    node.addEventListener('keydown', onKey);
    return () => node.removeEventListener('keydown', onKey);
  }, [onCancel, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[1400]" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
      <div className="fixed inset-0 bg-black/70" onClick={onCancel} aria-hidden="true" />
      <div className="relative z-10 flex min-h-full items-center justify-center p-4">
        <div ref={containerRef} className="w-full max-w-sm bg-neutral-900/95 backdrop-blur rounded-xl border border-neutral-800 shadow-2xl overflow-hidden text-neutral-100" data-testid="confirm-dialog" tabIndex={-1}>
          <div className="px-5 py-4 border-b border-neutral-800">
            <h4 id="confirm-title" className="text-base font-semibold">{title}</h4>
          </div>
          <div className="px-5 py-4 text-sm text-neutral-200">
            {message}
          </div>
          <div className="px-5 py-3 border-t border-neutral-800 flex items-center justify-end gap-2 bg-neutral-900/95">
            <button type="button" onClick={onCancel} className="rounded border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-sm font-medium text-neutral-200 hover:bg-neutral-700">{cancelText}</button>
            <button type="button" onClick={onConfirm} className="rounded border border-red-800/50 bg-transparent px-3 py-1.5 text-sm font-medium text-red-300 hover:bg-red-900/20">{confirmText}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
