"use client";

import React, { useEffect } from "react";

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
  useEffect(() => {
    try { window.dispatchEvent(new CustomEvent('tfh:overlay', { detail: { open } })); } catch {}
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[1400]">
      <div className="fixed inset-0 bg-black/70" onClick={onCancel} aria-hidden="true" />
      <div className="relative z-10 flex min-h-full items-center justify-center p-4">
        <div className="w-full max-w-sm bg-neutral-900/95 backdrop-blur rounded-xl border border-neutral-800 shadow-2xl overflow-hidden text-neutral-100">
          <div className="px-5 py-4 border-b border-neutral-800">
            <h4 className="text-base font-semibold">{title}</h4>
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

