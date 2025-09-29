"use client";

import { useEffect } from "react";

export default function NewFormClient() {
  useEffect(() => {
    const form = document.getElementById("tfh-new-form") as HTMLFormElement | null;
    const btn = document.getElementById("tfh-save-btn") as HTMLButtonElement | null;
    if (!form || !btn) return;
    const draftKey = "tfh_new_draft";
    const stepKey = "tfh_new_step";
    const step1 = document.getElementById("tfh-step-1");
    const step2 = document.getElementById("tfh-step-2");
    const nextBtn = document.getElementById("tfh-next-step");
    const prevBtn = document.getElementById("tfh-prev-step");
    const indicator = document.getElementById("tfh-step-indicator");

    const goStep = (n: 1 | 2) => {
      if (step1 && step2) {
        if (n === 1) { step1.classList.remove("hidden"); step2.classList.add("hidden"); }
        else { step1.classList.add("hidden"); step2.classList.remove("hidden"); }
        try { form.setAttribute("aria-busy", "false"); } catch {}
      }
      if (indicator) indicator.textContent = `Step ${n} of 2`;
    };

    const scrollToTop = () => {
      if (typeof window === 'undefined' || typeof window.scrollTo !== 'function') return;
      try {
        window.scrollTo({ top: 0, behavior: 'smooth' } as ScrollToOptions);
      } catch {
        try { window.scrollTo(0, 0); } catch {}
      }
    };
    const onNext = () => {
      const errBox = document.getElementById("tfh-form-error");
      const name = (form.querySelector('input[name="display_name"]') as HTMLInputElement | null)?.value?.trim() || "";
      if (!name) {
        if (errBox) { errBox.textContent = "Please enter a display name to continue."; errBox.classList.remove("hidden"); errBox.setAttribute('tabindex','-1'); (errBox as any).focus?.(); }
        (form.querySelector('input[name="display_name"]') as HTMLInputElement | null)?.focus?.();
        scrollToTop();
        return;
      }
      if (errBox) errBox.classList.add("hidden");
      try { localStorage.setItem(stepKey, "2"); } catch {}
      goStep(2);
    };
    nextBtn?.addEventListener("click", onNext);
    prevBtn?.addEventListener("click", () => { try { localStorage.setItem(stepKey, "1"); } catch {} goStep(1); });

    const onSubmit = (ev: Event) => {
      // Require hCaptcha completion if widget is present
      const tokenEl = document.querySelector<HTMLTextAreaElement>('textarea[name="h-captcha-response"]');
      const errBox = document.getElementById("tfh-form-error");
      const hasWidget = !!document.querySelector<HTMLElement>('.h-captcha');
      const token = tokenEl?.value?.trim();
      if (hasWidget && !token) {
        ev.preventDefault();
        if (errBox) { errBox.textContent = "Please complete the captcha before submitting."; errBox.classList.remove("hidden"); errBox.setAttribute('tabindex','-1'); (errBox as any).focus?.(); }
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
      try { form.setAttribute("aria-busy", "true"); } catch {}
    };
    form.addEventListener("submit", onSubmit);
    form.addEventListener('keydown', (e: any) => {
      if (e.key !== 'Enter') return;
      if ((e.target as HTMLElement)?.tagName === 'TEXTAREA') return;
      if (step1 && !step1.classList.contains('hidden')) { e.preventDefault(); onNext(); }
    });
    try { form.setAttribute("aria-busy", "false"); } catch {}
    // Live photo previews + validation for up to 5 slots
    const revokers: Array<() => void> = [];
    const applyPreviewFor = (i: number) => {
      const urlInput = document.getElementById(`tfh-photo-url-${i}`) as HTMLInputElement | null;
      const fileInput = document.getElementById(`tfh-photo-file-${i}`) as HTMLInputElement | null;
      const img = document.getElementById(`tfh-photo-prev-${i}`) as HTMLImageElement | null;
      const drop = document.getElementById(`tfh-drop-${i}`) as HTMLDivElement | null;
      const overlay = document.getElementById(`tfh-drop-overlay-${i}`) as HTMLDivElement | null;
      const removeBtn = document.getElementById(`tfh-photo-remove-${i}`) as HTMLButtonElement | null;
      const errBox = document.getElementById(`tfh-photo-err-${i}`) as HTMLDivElement | null;
      if (!img || !urlInput || !fileInput) return;

      let currentObjectUrl: string | null = null;
      const revoke = () => {
        if (currentObjectUrl) {
          try { URL.revokeObjectURL(currentObjectUrl); } catch {}
          currentObjectUrl = null;
        }
      };
      const setError = (msg: string | null) => {
        if (!errBox) return;
        if (msg) { errBox.textContent = msg; errBox.classList.remove("hidden"); }
        else { errBox.textContent = ""; errBox.classList.add("hidden"); }
      };
      const validateFile = async (file: File) => {
        const maxBytes = 5 * 1024 * 1024; // 5MB
        if (!file.type.startsWith("image/")) { setError("File must be an image."); return false; }
        if (file.size > maxBytes) { setError("Image must be ≤ 8MB."); return false; }
        try {
          const url = URL.createObjectURL(file);
          currentObjectUrl = url;
          await new Promise<void>((resolve, reject) => {
            const pic = new Image();
            pic.onload = () => { (pic.width >= 600 && pic.height >= 600) ? resolve() : reject(new Error("too small")); };
            pic.onerror = () => reject(new Error("bad image"));
            pic.src = url;
          });
        } catch {
          setError("Image seems invalid or too small ( min 600×600).");
          return false;
        }
        setError(null);
        return true;
      };
      const update = () => {
        let nextSrc = "";
        const files = (fileInput.files || []);
        if (files.length > 0 && files[0]) {
          revoke();
          const f = files[0];
          validateFile(f).then((ok) => {
            if (!ok) return;
            try {
              currentObjectUrl = URL.createObjectURL(f);
              img.src = currentObjectUrl;
              img.style.opacity = "1";
            } catch {}
          });
        } else if (urlInput.value && /^https?:\/\//i.test(urlInput.value)) {
          revoke();
          nextSrc = urlInput.value.trim();
          setError(null);
        } else {
          revoke();
          nextSrc = "";
        }
        if (!files.length) {
          if (nextSrc) {
            img.src = nextSrc;
            img.style.opacity = "1";
          } else {
            img.removeAttribute("src");
            img.style.opacity = "0";
          }
        }
        if (!nextSrc && !files.length) {
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
          setError(null);
        };
        removeBtn.addEventListener("click", onRemove);
        revokers.push(() => removeBtn.removeEventListener("click", onRemove));
      }
      // initialize
      update();
      revokers.push(() => { urlInput.removeEventListener("input", update); fileInput.removeEventListener("change", update); revoke(); });
    };
    for (let i = 0; i < 4; i++) applyPreviewFor(i);

    // Draft: autosave/restore
    const draftBanner = document.getElementById("tfh-draft-banner");
    const draftRestore = document.getElementById("tfh-draft-restore");
    const draftDiscard = document.getElementById("tfh-draft-discard");

    const collectDraft = () => {
      const data: Record<string, string> = {};
      form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>("input[name], textarea[name], select[name]").forEach((el) => {
        if (el instanceof HTMLInputElement && el.type === "file") return;
        data[el.name] = el.value || "";
      });
      return data;
    };
    const emptyForm = () => {
      for (const el of form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>("input[name], textarea[name], select[name]")) {
        if (el instanceof HTMLInputElement && el.type === "file") continue;
        if (el.value) return false;
      }
      return true;
    };
    // Auto-restore if we have a draft (so refresh retains data)
    try {
      const saved = localStorage.getItem(draftKey);
      if (saved) {
        const data = JSON.parse(saved) as Record<string, string>;
        form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>("input[name], textarea[name], select[name]").forEach((el) => {
          if (el instanceof HTMLInputElement && el.type === "file") return;
          if (data[el.name] !== undefined) el.value = data[el.name];
        });
      }
      // Decide initial step: if there's an error notice, keep saved step; otherwise reset to step 1
      const flags = document.getElementById('tfh-flags');
      const notice = flags?.getAttribute('data-notice') || '';
      if (notice) {
        const st = localStorage.getItem(stepKey);
        if (st === '2') goStep(2); else goStep(1);
      } else {
        try { localStorage.setItem(stepKey, '1'); } catch {}
        goStep(1);
      }
    } catch { goStep(1); }

    const restore = () => {
      try {
        const saved = localStorage.getItem(draftKey);
        if (!saved) return;
        const data = JSON.parse(saved) as Record<string, string>;
        form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>("input[name], textarea[name], select[name]").forEach((el) => {
          if (el instanceof HTMLInputElement && el.type === "file") return;
          if (data[el.name] !== undefined) el.value = data[el.name];
        });
        draftBanner?.classList.add("hidden");
      } catch {}
    };
    const discard = () => {
      try { localStorage.removeItem(draftKey); } catch {}
      draftBanner?.classList.add("hidden");
    };
    draftRestore?.addEventListener("click", restore);
    draftDiscard?.addEventListener("click", discard);
    revokers.push(() => { draftRestore?.removeEventListener("click", restore); draftDiscard?.removeEventListener("click", discard); });

    let saveTimer: any = null;
    const scheduleSave = () => {
      clearTimeout(saveTimer);
      saveTimer = setTimeout(() => {
        try { localStorage.setItem(draftKey, JSON.stringify(collectDraft())); } catch {}
      }, 800);
    };
    form.addEventListener("input", scheduleSave);
    form.addEventListener("change", scheduleSave);
    revokers.push(() => { clearTimeout(saveTimer); form.removeEventListener("input", scheduleSave); form.removeEventListener("change", scheduleSave); });

    return () => {
      form.removeEventListener("submit", onSubmit);
      revokers.forEach((fn) => fn());
    };
  }, []);
  return null;
}
