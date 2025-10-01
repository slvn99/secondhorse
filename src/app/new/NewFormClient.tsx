"use client";

import { useEffect } from "react";

type FieldElement = HTMLInputElement | HTMLTextAreaElement;
type RefreshFn = () => void;

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

    const fieldRefreshers: RefreshFn[] = [];

    const revokers: Array<() => void> = [];



    const sanitizeFieldValue = (value: string, max: number, multiline: boolean, mode: "input" | "blur") => {

      let next = typeof value === "string" ? value : String(value ?? "");

      try {

        next = next.normalize("NFC");

      } catch {}

      next = next.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, "");

      if (!multiline) next = next.replace(/[\r\n]+/g, " ");

      if (mode === "blur") next = next.trim();

      if (max > 0 && next.length > max) next = next.slice(0, max);

      return next;

    };



    const updateCounter = (counter: HTMLElement | null, value: string, max: number) => {

      if (!counter) return;

      const length = value.length;

      counter.textContent = max > 0 ? `${length} / ${max}` : `${length}`;

    };



    const setFieldError = (

      field: FieldElement | HTMLInputElement,

      target: HTMLElement | null,

      message: string | null,

    ) => {

      if (message) {

        field.setAttribute("aria-invalid", "true");

        document.getElementById("tfh-form-error")?.classList.add("hidden");

        if (target) {

          target.textContent = message;

          target.classList.remove("hidden");

        }

      } else {

        field.removeAttribute("aria-invalid");

        if (target) {

          target.textContent = "";

          target.classList.add("hidden");

        }

      }

    };



    const runFieldRefreshers = () => {

      fieldRefreshers.forEach((fn) => {

        try {

          fn();

        } catch {

          // Ignore refresh errors so individual fields do not block others.

        }

      });

    };



    const enhanceTextFields = () => {

      const fields = form.querySelectorAll<FieldElement>("[data-field]");

      fields.forEach((field) => {

        const maxAttr = Number(field.dataset.maxlength || field.maxLength || 0);

        const counter = form.querySelector<HTMLElement>(`[data-count-for="${field.name}"]`);

        const errorEl = form.querySelector<HTMLElement>(`[data-error-for="${field.name}"]`);

        const listLimit = Number(field.dataset.listLimit || 0);

        const listMax = Number(field.dataset.listMax || 0);

        const isList = field.dataset.listField === "comma";

        const multiline = field instanceof HTMLTextAreaElement;



        const applySanitized = (mode: "input" | "blur") => {

          const previous = field.value;

          const sanitized = sanitizeFieldValue(previous, maxAttr, multiline, mode);

          if (sanitized !== previous) {

            field.value = sanitized;

          }

          if (mode === "blur" && isList && field.value) {

            const tidy = field.value.split(",").map((item) => item.trim()).filter(Boolean).join(", ");

            field.value = tidy;

          }

        };



        const evaluate = () => {

          const trimmed = field.value.trim();

          if (trimmed.length > 0) {

            field.dataset.touched = "true";

          }

          updateCounter(counter, field.value, maxAttr);

          const touched = field.dataset.touched === "true";

          let message: string | null = null;

          if (field.required && touched && trimmed.length === 0) {

            const label = field.dataset.requiredLabel;

            message = label ? `${label} is required.` : "This field is required.";

          } else if (isList && trimmed.length > 0) {

            const items = trimmed.split(",").map((item) => item.trim()).filter(Boolean);

            if (listLimit && items.length > listLimit) {

              message = `Please keep to ${listLimit} entries or fewer.`;

            } else if (listMax) {

              const tooLong = items.find((item) => item.length > listMax);

              if (tooLong) {

                message = `Each entry must be ${listMax} characters or fewer.`;

              }

            }

          }

          setFieldError(field, errorEl, message);

        };



        const onInput = () => {

          const caret = field.selectionStart;

          const before = field.value;

          applySanitized("input");

          if (field.value !== before && typeof caret === "number") {

            const pos = Math.min(caret, field.value.length);

            try {

              field.setSelectionRange(pos, pos);

            } catch {}

          }

          field.dataset.touched = "true";

          evaluate();

        };



        const onBlur = () => {

          field.dataset.touched = "true";

          applySanitized("blur");

          evaluate();

        };



        applySanitized("blur");

        evaluate();



        field.addEventListener("input", onInput);

        field.addEventListener("blur", onBlur);

        revokers.push(() => {

          field.removeEventListener("input", onInput);

          field.removeEventListener("blur", onBlur);

        });

        fieldRefreshers.push(() => {

          applySanitized("blur");

          evaluate();

        });

      });

    };



    const enhanceNumberFields = () => {

      const numberFields = form.querySelectorAll<HTMLInputElement>("[data-number-field]");

      numberFields.forEach((input) => {

        const errorEl = form.querySelector<HTMLElement>(`[data-error-for="${input.name}"]`);

        const min = input.min !== "" ? Number(input.min) : null;

        const max = input.max !== "" ? Number(input.max) : null;



        const update = () => {

          const before = input.value;

          const digits = before.replace(/[^0-9]/g, "");

          if (digits !== before) {

            input.value = digits;

          }

          let message: string | null = null;

          if (input.value) {

            const numeric = Number(input.value);

            if (!Number.isFinite(numeric)) {

              message = "Enter a valid number.";

            } else if (!Number.isInteger(numeric)) {

              message = "Use whole numbers only.";

            } else if (min !== null && numeric < min) {

              message = `Must be at least ${min}.`;

            } else if (max !== null && numeric > max) {

              message = `Must be ${max} or less.`;

            }

          }

          setFieldError(input, errorEl, message);

        };



        const onInput = () => {

          const caret = input.selectionStart;

          update();

          if (typeof caret === "number") {

            const pos = Math.min(caret, input.value.length);

            try {

              input.setSelectionRange(pos, pos);

            } catch {}

          }

        };



        update();

        input.addEventListener("input", onInput);

        input.addEventListener("blur", update);

        revokers.push(() => {

          input.removeEventListener("input", onInput);

          input.removeEventListener("blur", update);

        });

        fieldRefreshers.push(update);

      });

    };



    enhanceTextFields();

    enhanceNumberFields();



    const goStep = (n: 1 | 2) => {

      if (step1 && step2) {

        if (n === 1) {

          step1.classList.remove("hidden");

          step2.classList.add("hidden");

        } else {

          step1.classList.add("hidden");

          step2.classList.remove("hidden");

        }

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

      const nameInput = form.querySelector<HTMLInputElement>('input[name="display_name"]');

      const name = nameInput?.value?.trim() || "";

      if (!name) {

        if (nameInput) {

          nameInput.dataset.touched = "true";

        }

        runFieldRefreshers();

        if (errBox) { errBox.textContent = "Please enter a display name to continue."; errBox.classList.remove("hidden"); errBox.setAttribute('tabindex','-1'); (errBox as any).focus?.(); }

        nameInput?.focus?.();

        scrollToTop();

        return;

      }

      if (errBox) errBox.classList.add("hidden");

      try { localStorage.setItem(stepKey, "2"); } catch {}

      goStep(2);

    };



    const onPrev = () => {

      try { localStorage.setItem(stepKey, "1"); } catch {}

      goStep(1);

    };



    nextBtn?.addEventListener("click", onNext);

    prevBtn?.addEventListener("click", onPrev);



    const onSubmit = (ev: Event) => {

      runFieldRefreshers();

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

    const onKeydown = (e: KeyboardEvent) => {

      if (e.key !== 'Enter') return;

      if ((e.target as HTMLElement)?.tagName === 'TEXTAREA') return;

      if (step1 && !step1.classList.contains('hidden')) { e.preventDefault(); onNext(); }

    };

    form.addEventListener('keydown', onKeydown);

    try { form.setAttribute("aria-busy", "false"); } catch {}

    // Live photo previews + validation for up to 4 slots



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

        if (file.size > maxBytes) { setError("Image must be 5MB or smaller."); return false; }

        let testUrl: string | null = null;

        try {

          testUrl = URL.createObjectURL(file);

          await new Promise<void>((resolve, reject) => {

            const pic = new Image();

            pic.onload = () => { (pic.width >= 600 && pic.height >= 600) ? resolve() : reject(new Error("too-small")); };

            pic.onerror = () => reject(new Error("invalid"));

            pic.src = testUrl!;

          });

        } catch (err) {

          const message = err instanceof Error && err.message === "too-small"

            ? "Image must be at least 600x600 pixels."

            : "Could not read the image. Please try another file.";

          setError(message);

          return false;

        } finally {

          if (testUrl) {

            try { URL.revokeObjectURL(testUrl); } catch {}

          }

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

        } else if (urlInput.value) {

          revoke();

          nextSrc = "";

          setError("URLs must start with http:// or https://.");

        } else {

          revoke();

          nextSrc = "";

          setError(null);

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
    let hasDraftSaved = false;

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
          if (data[el.name] !== undefined) {
            el.value = data[el.name];
            if (data[el.name]) el.setAttribute("data-touched", "true");
          }
        });
        hasDraftSaved = Object.values(data).some((value) => typeof value === "string" && value.trim().length > 0);
      } else {
        hasDraftSaved = false;
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

    runFieldRefreshers();
    if (hasDraftSaved) draftBanner?.classList.remove('hidden');
    else draftBanner?.classList.add('hidden');

    const restore = () => {
      try {
        const saved = localStorage.getItem(draftKey);
        if (!saved) return;
        const data = JSON.parse(saved) as Record<string, string>;
        form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>("input[name], textarea[name], select[name]").forEach((el) => {
          if (el instanceof HTMLInputElement && el.type === "file") return;
          if (data[el.name] !== undefined) {
            el.value = data[el.name];
            if (data[el.name]) el.setAttribute("data-touched", "true");
          }
        });
        hasDraftSaved = Object.values(data).some((value) => typeof value === "string" && value.trim().length > 0);
        runFieldRefreshers();
        draftBanner?.classList.add("hidden");
      } catch {}
    };
    const discard = () => {
      try { localStorage.removeItem(draftKey); } catch {}
      hasDraftSaved = false;
      draftBanner?.classList.add("hidden");
    };
    draftRestore?.addEventListener("click", restore);
    draftDiscard?.addEventListener("click", discard);
    revokers.push(() => { draftRestore?.removeEventListener("click", restore); draftDiscard?.removeEventListener("click", discard); });

    let saveTimer: ReturnType<typeof setTimeout> | null = null;
    const scheduleSave = () => {
      if (saveTimer) clearTimeout(saveTimer);
      saveTimer = setTimeout(() => {
        const payload = collectDraft();
        const hasContent = Object.values(payload).some((value) => typeof value === "string" && value.trim().length > 0);
        try {
          if (hasContent) {
            localStorage.setItem(draftKey, JSON.stringify(payload));
            draftBanner?.classList.remove("hidden");
            hasDraftSaved = true;
          } else {
            localStorage.removeItem(draftKey);
            draftBanner?.classList.add("hidden");
            hasDraftSaved = false;
          }
        } catch {}
      }, 800);
    };
    form.addEventListener("input", scheduleSave);
    form.addEventListener("change", scheduleSave);
    revokers.push(() => { if (saveTimer) clearTimeout(saveTimer); form.removeEventListener("input", scheduleSave); form.removeEventListener("change", scheduleSave); });

    return () => {
      form.removeEventListener("submit", onSubmit);
      form.removeEventListener("keydown", onKeydown);
      nextBtn?.removeEventListener("click", onNext);
      prevBtn?.removeEventListener("click", onPrev);
      revokers.forEach((fn) => fn());
    };
  }, []);
  return null;
}
