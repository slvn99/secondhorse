"use client";

import { useEffect } from "react";

export default function NewFormClient() {
  useEffect(() => {
    const form = document.getElementById("tfh-new-form") as HTMLFormElement | null;
    const btn = document.getElementById("tfh-save-btn") as HTMLButtonElement | null;
    if (!form || !btn) return;
    const onSubmit = (ev: Event) => {
      // Require hCaptcha completion if widget is present
      const tokenEl = document.querySelector<HTMLTextAreaElement>('textarea[name="h-captcha-response"]');
      const errBox = document.getElementById("tfh-form-error");
      const hasWidget = !!document.querySelector<HTMLElement>('.h-captcha');
      const token = tokenEl?.value?.trim();
      if (hasWidget && !token) {
        ev.preventDefault();
        if (errBox) {
          errBox.textContent = "Please complete the captcha before submitting.";
          errBox.classList.remove("hidden");
        }
        try { (window as any).hcaptcha?.execute?.(); } catch {}
        return;
      }
      if (errBox) errBox.classList.add("hidden");
      const spinner = btn.querySelector("[data-spinner]") as HTMLElement | null;
      const label = btn.querySelector("[data-label]") as HTMLElement | null;
      if (spinner) spinner.classList.remove("hidden");
      if (label) label.textContent = "Saving...";
      btn.disabled = true;
      btn.setAttribute("aria-busy", "true");
    };
    form.addEventListener("submit", onSubmit);
    // Live photo previews for up to 5 slots
    const revokers: Array<() => void> = [];
    const applyPreviewFor = (i: number) => {
      const urlInput = document.getElementById(`tfh-photo-url-${i}`) as HTMLInputElement | null;
      const fileInput = document.getElementById(`tfh-photo-file-${i}`) as HTMLInputElement | null;
      const img = document.getElementById(`tfh-photo-prev-${i}`) as HTMLImageElement | null;
      const drop = document.getElementById(`tfh-drop-${i}`) as HTMLDivElement | null;
      const overlay = document.getElementById(`tfh-drop-overlay-${i}`) as HTMLDivElement | null;
      const removeBtn = document.getElementById(`tfh-photo-remove-${i}`) as HTMLButtonElement | null;
      if (!img || !urlInput || !fileInput) return;

      let currentObjectUrl: string | null = null;
      const revoke = () => {
        if (currentObjectUrl) {
          try { URL.revokeObjectURL(currentObjectUrl); } catch {}
          currentObjectUrl = null;
        }
      };
      const update = () => {
        let nextSrc = "";
        const files = (fileInput.files || []);
        if (files.length > 0 && files[0]) {
          revoke();
          currentObjectUrl = URL.createObjectURL(files[0]);
          nextSrc = currentObjectUrl;
        } else if (urlInput.value && /^https?:\/\//i.test(urlInput.value)) {
          revoke();
          nextSrc = urlInput.value.trim();
        } else {
          revoke();
          nextSrc = "";
        }
        if (nextSrc) {
          img.src = nextSrc;
          img.style.opacity = "1";
        } else {
          img.removeAttribute("src");
          img.style.opacity = "0";
        }
      };
      urlInput.addEventListener("input", update);
      fileInput.addEventListener("change", update);

      // Drag & drop support
      if (drop) {
        const onDragOver = (e: DragEvent) => { e.preventDefault(); drop.classList.add("ring-2", "ring-yellow-400/70"); if (overlay) overlay.classList.remove("hidden"); };
        const onDragLeave = () => { drop.classList.remove("ring-2", "ring-yellow-400/70"); if (overlay) overlay.classList.add("hidden"); };
        const onDrop = (e: DragEvent) => {
          e.preventDefault();
          drop.classList.remove("ring-2", "ring-yellow-400/70"); if (overlay) overlay.classList.add("hidden");
          const dt = e.dataTransfer;
          if (!dt) return;
          if (dt.files && dt.files.length > 0) {
            const file = dt.files[0];
            if (file && file.type.startsWith("image/")) {
              try {
                const data = new DataTransfer();
                data.items.add(file);
                fileInput.files = data.files;
              } catch {
                // Fallback: still show preview via object URL
                revoke();
                currentObjectUrl = URL.createObjectURL(file);
                img.src = currentObjectUrl;
                img.style.opacity = "1";
              }
              update();
              return;
            }
          }
          const url = dt.getData("text/uri-list") || dt.getData("text/plain");
          if (url && /^https?:\/\//i.test(url)) {
            urlInput.value = url.trim();
            update();
          }
        };
        drop.addEventListener("dragover", onDragOver);
        drop.addEventListener("dragenter", onDragOver);
        drop.addEventListener("dragleave", onDragLeave);
        drop.addEventListener("drop", onDrop);
        revokers.push(() => {
          drop.removeEventListener("dragover", onDragOver);
          drop.removeEventListener("dragenter", onDragOver);
          drop.removeEventListener("dragleave", onDragLeave);
          drop.removeEventListener("drop", onDrop);
        });
      }

      // Remove button
      if (removeBtn) {
        const onRemove = () => {
          try { urlInput.value = ""; } catch {}
          try { fileInput.value = ""; } catch {}
          revoke();
          img.removeAttribute("src");
          img.style.opacity = "0";
        };
        removeBtn.addEventListener("click", onRemove);
        revokers.push(() => removeBtn.removeEventListener("click", onRemove));
      }
      // initialize
      update();
      revokers.push(() => { urlInput.removeEventListener("input", update); fileInput.removeEventListener("change", update); revoke(); });
    };
    for (let i = 0; i < 5; i++) applyPreviewFor(i);

    return () => {
      form.removeEventListener("submit", onSubmit);
      revokers.forEach((fn) => fn());
    };
  }, []);
  return null;
}
