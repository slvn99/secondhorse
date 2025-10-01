"use client";

import { useEffect } from "react";

type FieldElement = HTMLInputElement | HTMLTextAreaElement;
type RefreshFn = () => void;

const PHOTO_MIN_LONG_SIDE = 600;
const PHOTO_MIN_SHORT_SIDE = 400;

export default function NewFormClient() {
  useEffect(() => {
    const form = document.getElementById("tfh-new-form") as HTMLFormElement | null;
    const btn = document.getElementById("tfh-save-btn") as HTMLButtonElement | null;
    if (!form || !btn) return;
    const step1 = document.getElementById("tfh-step-1");
    const step2 = document.getElementById("tfh-step-2");
    const step3 = document.getElementById("tfh-step-3");
    const nextStep1 = document.getElementById("tfh-next-step-1");
    const nextStep2 = document.getElementById("tfh-next-step-2");
    const prevStep2 = document.getElementById("tfh-prev-step-2");
    const prevStep3 = document.getElementById("tfh-prev-step-3");
    const indicator = document.getElementById("tfh-step-indicator");
    const formError = document.getElementById("tfh-form-error");

    const fieldRefreshers: RefreshFn[] = [];

    const revokers: Array<() => void> = [];
    const steps: Array<HTMLElement | null> = [step1, step2, step3];
    let currentStep: 1 | 2 | 3 = 1;



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

        formError?.classList.add("hidden");

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



    const goStep = (n: 1 | 2 | 3) => {
      currentStep = n;
      steps.forEach((step, idx) => {
        if (!step) return;
        if (idx === n - 1) step.classList.remove("hidden");
        else step.classList.add("hidden");
      });
      try { form.setAttribute("aria-busy", "false"); } catch {}
      if (indicator) indicator.textContent = `Step ${n} of 3`;
    };



    const scrollToTop = () => {
      if (typeof window === 'undefined' || typeof window.scrollTo !== 'function') return;
      try {
        window.scrollTo({ top: 0, behavior: 'smooth' } as ScrollToOptions);
      } catch {
        try { window.scrollTo(0, 0); } catch {}
      }
    };

    const requireDisplayName = () => {
      const nameInput = form.querySelector<HTMLInputElement>('input[name="display_name"]');
      const name = nameInput?.value?.trim() || "";
      if (!name) {
        if (nameInput) {
          nameInput.dataset.touched = "true";
        }
        runFieldRefreshers();
        if (formError) {
          formError.textContent = "Please enter a display name to continue.";
          formError.classList.remove("hidden");
          formError.setAttribute('tabindex', '-1');
          (formError as any).focus?.();
        }
        nameInput?.focus?.();
        scrollToTop();
        return false;
      }
      formError?.classList.add("hidden");
      return true;
    };

    const goToStep2 = () => {
      if (!requireDisplayName()) return;
      goStep(2);
      scrollToTop();
    };

    const goToStep3 = () => {
      formError?.classList.add("hidden");
      goStep(3);
      scrollToTop();
    };

    const backToStep1 = () => {
      formError?.classList.add("hidden");
      goStep(1);
      scrollToTop();
    };

    const backToStep2 = () => {
      formError?.classList.add("hidden");
      goStep(2);
      scrollToTop();
    };

    nextStep1?.addEventListener("click", goToStep2);
    nextStep2?.addEventListener("click", goToStep3);
    prevStep2?.addEventListener("click", backToStep1);
    prevStep3?.addEventListener("click", backToStep2);

    goStep(1);

    const onSubmit = (ev: Event) => {

      runFieldRefreshers();

      // Require hCaptcha completion if widget is present

      const tokenEl = document.querySelector<HTMLTextAreaElement>('textarea[name="h-captcha-response"]');

      const errBox = formError;

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
      const target = e.target as HTMLElement | null;
      if (target && target.tagName === 'TEXTAREA') return;
      if (currentStep === 1) {
        e.preventDefault();
        goToStep2();
      } else if (currentStep === 2) {
        e.preventDefault();
        goToStep3();
      }
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
        let width = 0;
        let height = 0;
        try {
          testUrl = URL.createObjectURL(file);
          await new Promise<void>((resolve, reject) => {
            const pic = new Image();
            pic.onload = () => {
              width = pic.naturalWidth || pic.width || 0;
              height = pic.naturalHeight || pic.height || 0;
              const longSide = Math.max(width, height);
              const shortSide = Math.min(width, height);
              if (longSide < PHOTO_MIN_LONG_SIDE || shortSide < PHOTO_MIN_SHORT_SIDE) {
                reject(new Error("too-small"));
                return;
              }
              resolve();
            };
            pic.onerror = () => reject(new Error("invalid"));
            pic.src = testUrl!;
          });
        } catch (err) {
          const dimHint = width && height ? ` (got ${width}x${height})` : "";
          const message = err instanceof Error && err.message === "too-small"
            ? `Image must be at least ${PHOTO_MIN_LONG_SIDE}px on the longest side and ${PHOTO_MIN_SHORT_SIDE}px on the shortest side${dimHint}.`
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

    
    return () => {
      form.removeEventListener("submit", onSubmit);
      form.removeEventListener("keydown", onKeydown);
      nextStep1?.removeEventListener("click", goToStep2);
      nextStep2?.removeEventListener("click", goToStep3);
      prevStep2?.removeEventListener("click", backToStep1);
      prevStep3?.removeEventListener("click", backToStep2);
      revokers.forEach((fn) => fn());
    };
  }, []);
  return null;
}
