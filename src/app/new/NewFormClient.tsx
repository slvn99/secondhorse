"use client";

import { useEffect } from "react";

export default function NewFormClient() {
  useEffect(() => {
    const form = document.getElementById("tfh-new-form") as HTMLFormElement | null;
    const btn = document.getElementById("tfh-save-btn") as HTMLButtonElement | null;
    if (!form || !btn) return;
    const onSubmit = () => {
      const spinner = btn.querySelector("[data-spinner]") as HTMLElement | null;
      const label = btn.querySelector("[data-label]") as HTMLElement | null;
      if (spinner) spinner.classList.remove("hidden");
      if (label) label.textContent = "Saving...";
      btn.disabled = true;
      btn.setAttribute("aria-busy", "true");
    };
    form.addEventListener("submit", onSubmit);
    return () => form.removeEventListener("submit", onSubmit);
  }, []);
  return null;
}

