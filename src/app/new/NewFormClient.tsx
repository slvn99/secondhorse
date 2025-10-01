"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";

type Notice = {
  type: "success" | "error" | "info";
  message: string;
};

type NewFormClientProps = {
  action: (formData: FormData) => void;
  notice?: Notice | null;
};

type PhotoState = {
  url: string;
  file: File | null;
  previewUrl: string | null;
  error: string | null;
  inputResetKey: number;
};

type FormErrors = {
  displayName?: string | null;
  ageYears?: string | null;
  heightCm?: string | null;
  interests?: string | null;
  disciplines?: string | null;
};

const initialPhotoState = (): PhotoState => ({
  url: "",
  file: null,
  previewUrl: null,
  error: null,
  inputResetKey: 0,
});

function sanitizeSingleLine(value: string, max: number, trim: boolean) {
  let next = value.normalize("NFC").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, "");
  next = next.replace(/[\r\n]+/g, " ");
  if (trim) next = next.trim();
  if (max > 0 && next.length > max) next = next.slice(0, max);
  return next;
}

function sanitizeMultiline(value: string, max: number, trim: boolean) {
  let next = value.normalize("NFC").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, "");
  if (trim) next = next.trim();
  if (max > 0 && next.length > max) next = next.slice(0, max);
  return next;
}

function validateCommaList(value: string, limit: number, itemMax: number): string | null {
  if (!value.trim()) return null;
  const items = value
    .split(",")
    .map((item) => sanitizeSingleLine(item, itemMax, true))
    .filter((item) => item.length > 0);
  if (items.length > limit) {
    return `Please keep to ${limit} entries or fewer.`;
  }
  const tooLong = items.find((item) => item.length > itemMax);
  if (tooLong) {
    return `Each entry must be ${itemMax} characters or fewer.`;
  }
  return null;
}

function tidyCommaList(value: string, limit: number, itemMax: number) {
  const items = value
    .split(",")
    .map((item) => sanitizeSingleLine(item, itemMax, true))
    .filter((item) => item.length > 0);
  const unique = Array.from(new Set(items)).slice(0, limit);
  return unique.join(", ");
}

function parseNumberWithin(value: string, min: number | null, max: number | null): string | null {
  if (!value) return null;
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "Enter a valid number.";
  if (!Number.isInteger(numeric)) return "Use whole numbers only.";
  if (min !== null && numeric < min) return `Must be at least ${min}.`;
  if (max !== null && numeric > max) return `Must be ${max} or less.`;
  return null;
}

function nextPhotoState(updater: (photo: PhotoState) => PhotoState, index: number) {
  return (prev: PhotoState[]): PhotoState[] =>
    prev.map((photo, idx) => (idx === index ? updater(photo) : photo));
}

export default function NewFormClient({ action, notice }: NewFormClientProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [displayName, setDisplayName] = useState("");
  const [breed, setBreed] = useState("");
  const [gender, setGender] = useState("mare");
  const [ageYears, setAgeYears] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [color, setColor] = useState("");
  const [temperament, setTemperament] = useState("");
  const [bio, setBio] = useState("");
  const [locationCity, setLocationCity] = useState("");
  const [locationCountry, setLocationCountry] = useState("");
  const [interests, setInterests] = useState("");
  const [disciplines, setDisciplines] = useState("");
  const [photos, setPhotos] = useState<PhotoState[]>(() =>
    Array.from({ length: 4 }, initialPhotoState)
  );
  const [primaryPhoto, setPrimaryPhoto] = useState(0);
  const [errors, setErrors] = useState<FormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement | null>(null);
  const displayNameRef = useRef<HTMLInputElement | null>(null);
  const ageRef = useRef<HTMLInputElement | null>(null);
  const heightRef = useRef<HTMLInputElement | null>(null);
  const interestsRef = useRef<HTMLInputElement | null>(null);
  const disciplinesRef = useRef<HTMLInputElement | null>(null);
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    setIsSubmitting(false);
  }, [notice?.message, notice?.type]);

  useEffect(() => {
    try {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      try { window.scrollTo(0, 0); } catch {}
    }
  }, [step]);

  useEffect(() => {
    return () => {
      photos.forEach((photo) => {
        if (photo.previewUrl && photo.previewUrl.startsWith("blob:")) {
          try { URL.revokeObjectURL(photo.previewUrl); } catch {}
        }
      });
    };
  }, [photos]);

  const submitLabel = isSubmitting ? "Saving..." : "Save";

  const updateListField = useCallback(
    (
      value: string,
      setter: React.Dispatch<React.SetStateAction<string>>,
      key: "interests" | "disciplines",
      limit: number,
      itemMax: number,
      trim: boolean,
    ) => {
      const sanitized = sanitizeSingleLine(value, 500, false);
      setter(trim ? tidyCommaList(sanitized, limit, itemMax) : sanitized);
      const message = validateCommaList(trim ? tidyCommaList(sanitized, limit, itemMax) : sanitized, limit, itemMax);
      setErrors((prev) => ({ ...prev, [key]: message }));
    },
    []
  );

  const ensureDisplayName = useCallback(() => {
    const trimmed = sanitizeSingleLine(displayName, 120, true);
    setDisplayName(trimmed);
    if (!trimmed) {
      setErrors((prev) => ({ ...prev, displayName: "Display name is required." }));
      setFormError("Please enter a display name to continue.");
      displayNameRef.current?.focus();
      return false;
    }
    setErrors((prev) => ({ ...prev, displayName: null }));
    setFormError(null);
    return true;
  }, [displayName]);

  const nextFromStepOne = useCallback(() => {
    if (!ensureDisplayName()) {
      setStep(1);
      return;
    }
    setFormError(null);
    setStep(2);
  }, [ensureDisplayName]);

  const nextFromStepTwo = useCallback(() => {
    const interestError = validateCommaList(interests, 12, 48);
    const disciplineError = validateCommaList(disciplines, 12, 48);
    setErrors((prev) => ({ ...prev, interests: interestError, disciplines: disciplineError }));
    if (interestError) {
      setFormError(interestError);
      interestsRef.current?.focus();
      return;
    }
    if (disciplineError) {
      setFormError(disciplineError);
      disciplinesRef.current?.focus();
      return;
    }
    setFormError(null);
    setStep(3);
  }, [disciplines, interests]);

  const handleNumberChange = useCallback(
    (
      event: React.ChangeEvent<HTMLInputElement>,
      setter: React.Dispatch<React.SetStateAction<string>>,
      key: "ageYears" | "heightCm",
      min: number | null,
      max: number | null,
    ) => {
      const digits = event.target.value.replace(/[^0-9]/g, "");
      setter(digits);
      const message = parseNumberWithin(digits, min, max);
      setErrors((prev) => ({ ...prev, [key]: message }));
    },
    []
  );

  const handleNumberBlur = useCallback(
    (
      value: string,
      setter: React.Dispatch<React.SetStateAction<string>>,
      key: "ageYears" | "heightCm",
      min: number | null,
      max: number | null,
    ) => {
      const trimmed = value.replace(/^0+(\d)/, "$1");
      setter(trimmed);
      const message = parseNumberWithin(trimmed, min, max);
      setErrors((prev) => ({ ...prev, [key]: message }));
    },
    []
  );

  const handlePhotoUrlChange = useCallback((index: number, raw: string) => {
    const nextValue = sanitizeSingleLine(raw, 1000, false);
    setPhotos(nextPhotoState((photo) => {
      const url = nextValue;
      const error = !url || /^https?:\/\//i.test(url) ? null : "URLs must start with http:// or https://.";
      return {
        ...photo,
        url,
        error,
        previewUrl: photo.file ? photo.previewUrl : url || null,
      };
    }, index));
  }, []);

  const handlePhotoUrlBlur = useCallback((index: number) => {
    setPhotos(nextPhotoState((photo) => {
      const url = sanitizeSingleLine(photo.url, 1000, true);
      const error = !url || /^https?:\/\//i.test(url) ? null : "URLs must start with http:// or https://.";
      return {
        ...photo,
        url,
        error,
        previewUrl: photo.file ? photo.previewUrl : url || null,
      };
    }, index));
  }, []);

  const handlePhotoFileChange = useCallback((index: number, file: File | null) => {
    setPhotos(nextPhotoState((photo) => {
      if (photo.previewUrl && photo.previewUrl.startsWith("blob:")) {
        try { URL.revokeObjectURL(photo.previewUrl); } catch {}
      }
      if (!file) {
        return {
          ...photo,
          file: null,
          previewUrl: photo.url ? photo.url : null,
          error: null,
          inputResetKey: photo.inputResetKey + 1,
        };
      }
      if (!file.type.startsWith("image/")) {
        return {
          ...photo,
          file: null,
          previewUrl: photo.url ? photo.url : null,
          error: "Please choose an image file.",
          inputResetKey: photo.inputResetKey + 1,
        };
      }
      const previewUrl = URL.createObjectURL(file);
      return {
        ...photo,
        file,
        previewUrl,
        error: null,
      };
    }, index));
  }, []);

  const handlePhotoClear = useCallback((index: number) => {
    setPhotos(nextPhotoState((photo) => {
      if (photo.previewUrl && photo.previewUrl.startsWith("blob:")) {
        try { URL.revokeObjectURL(photo.previewUrl); } catch {}
      }
      return {
        ...photo,
        url: "",
        file: null,
        previewUrl: null,
        error: null,
        inputResetKey: photo.inputResetKey + 1,
      };
    }, index));
    if (primaryPhoto === index) {
      setPrimaryPhoto(0);
    }
    const input = fileInputRefs.current[index];
    if (input) input.value = "";
  }, [primaryPhoto]);

  const handlePhotoDrop = useCallback((index: number, event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const dt = event.dataTransfer;
    if (!dt) return;
    if (dt.files && dt.files.length > 0) {
      const file = dt.files[0];
      handlePhotoFileChange(index, file);
      const input = fileInputRefs.current[index];
      if (input) {
        try {
          const data = new DataTransfer();
          data.items.add(file);
          input.files = data.files;
        } catch {}
      }
      return;
    }
    const url = dt.getData("text/uri-list") || dt.getData("text/plain");
    if (url && /^https?:\/\//i.test(url)) {
      handlePhotoUrlChange(index, url.trim());
    }
  }, [handlePhotoFileChange, handlePhotoUrlChange]);

  const hasPhotoErrors = useMemo(() => photos.some((photo) => photo.error), [photos]);

  const handleSubmit = useCallback((event: React.FormEvent<HTMLFormElement>) => {
    if (isSubmitting) {
      event.preventDefault();
      return;
    }

    const nameOk = ensureDisplayName();
    if (!nameOk) {
      event.preventDefault();
      setStep(1);
      return;
    }

    const ageError = parseNumberWithin(ageYears, 0, 40);
    const heightError = parseNumberWithin(heightCm, 50, 230);
    setErrors((prev) => ({ ...prev, ageYears: ageError, heightCm: heightError }));
    if (ageError) {
      event.preventDefault();
      setFormError(ageError);
      setStep(1);
      ageRef.current?.focus();
      return;
    }
    if (heightError) {
      event.preventDefault();
      setFormError(heightError);
      setStep(1);
      heightRef.current?.focus();
      return;
    }

    const interestError = validateCommaList(interests, 12, 48);
    const disciplineError = validateCommaList(disciplines, 12, 48);
    setErrors((prev) => ({ ...prev, interests: interestError, disciplines: disciplineError }));
    if (interestError) {
      event.preventDefault();
      setFormError(interestError);
      setStep(2);
      interestsRef.current?.focus();
      return;
    }
    if (disciplineError) {
      event.preventDefault();
      setFormError(disciplineError);
      setStep(2);
      disciplinesRef.current?.focus();
      return;
    }

    if (hasPhotoErrors) {
      event.preventDefault();
      setFormError("Please fix photo errors before submitting.");
      setStep(3);
      return;
    }

    const hasCaptchaWidget = typeof document !== "undefined" && !!document.querySelector<HTMLElement>(".h-captcha");
    const captchaToken = typeof document !== "undefined"
      ? document.querySelector<HTMLTextAreaElement>('textarea[name="h-captcha-response"]')?.value.trim()
      : "";
    if (hasCaptchaWidget && !captchaToken) {
      event.preventDefault();
      setFormError("Please complete the captcha before submitting.");
      setStep(3);
      try { (window as any).hcaptcha?.execute?.(); } catch {}
      return;
    }

    setFormError(null);
    setIsSubmitting(true);
  }, [ageYears, disciplines, ensureDisplayName, hasPhotoErrors, heightCm, interests, isSubmitting]);

  const stepIndicator = `Step ${step} of 3`;
  const photoPrimaryValue = primaryPhoto;

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-6 pb-[calc(var(--footer-height,3rem)+2rem)]">
        <div className="sticky top-0 z-20 -mx-4 sm:-mx-6 px-4 sm:px-6 py-3 bg-neutral-950/85 backdrop-blur supports-[backdrop-filter]:bg-neutral-950/60 border-b border-neutral-800/60">
          <div className="mx-auto max-w-3xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-semibold">Add Horse Profile</h1>
              <span id="tfh-step-indicator" aria-live="polite" className="inline-flex items-center gap-2 text-[11px] font-medium px-2 py-0.5 rounded bg-neutral-800/70 border border-neutral-700 text-neutral-200">
                {stepIndicator}
              </span>
            </div>
            <Link id="tfh-home-link" href="/" className="inline-flex items-center gap-2 rounded border border-neutral-700 px-3 py-1 text-sm text-neutral-200 hover:bg-neutral-800 transition">
              Back home
            </Link>
          </div>
        </div>

        {notice && (
          <div className={`mt-4 rounded border px-3 py-2 text-sm ${
            notice.type === "error"
              ? "border-red-800 bg-red-900/40 text-red-200"
              : notice.type === "success"
              ? "border-green-700 bg-green-900/30 text-green-200"
              : "border-blue-700 bg-blue-900/30 text-blue-100"
          }`}>
            {notice.message}
          </div>
        )}

        <form
          ref={formRef}
          id="tfh-new-form"
          action={action}
          onSubmit={handleSubmit}
          className="space-y-6 mt-6"
        >
          {formError && (
            <div id="tfh-form-error" className="rounded border border-red-800 bg-red-900/40 text-red-200 px-3 py-2 text-sm" role="alert">
              {formError}
            </div>
          )}
          {!formError && (
            <div id="tfh-form-error" className="hidden" aria-hidden="true" />
          )}
          <p className="text-sm text-neutral-400">Fields marked with <span className="text-yellow-400">*</span> are required. Others are optional.</p>
          <div className="mt-2 rounded-md border border-yellow-700/40 bg-yellow-900/20 text-yellow-100 px-3 py-2 text-xs">
            All profiles are reviewed by a human before publishing. Submissions may take up to 24 hours.
          </div>

          <div className={step === 1 ? "space-y-6" : "space-y-6 hidden"}>
            <div className="rounded-2xl border border-yellow-700/50 bg-yellow-900/10 p-4">
              <h2 className="text-lg font-semibold text-neutral-200">Basic Info</h2>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="text-sm text-neutral-300">
                  Display name <span className="text-yellow-400">*</span>
                  <input
                    ref={displayNameRef}
                    aria-describedby="hint-name"
                    name="display_name"
                    required
                    autoComplete="name"
                    maxLength={120}
                    value={displayName}
                    onChange={(event) => setDisplayName(sanitizeSingleLine(event.target.value, 120, false))}
                    onBlur={() => {
                      const trimmed = sanitizeSingleLine(displayName, 120, true);
                      setDisplayName(trimmed);
                      setErrors((prev) => ({ ...prev, displayName: trimmed ? null : "Display name is required." }));
                    }}
                    className="mt-1 w-full rounded border border-neutral-700 bg-neutral-900 text-neutral-100 px-3 py-2"
                  />
                  <div className="mt-1 flex items-start justify-between text-xs text-neutral-400">
                    <p id="hint-name" className="leading-snug">Public name shown on the profile.</p>
                    <span data-count-for="display_name" aria-live="polite" className="pl-2 text-neutral-500">{displayName.length} / 120</span>
                  </div>
                  {errors.displayName ? (
                    <p data-error-for="display_name" className="mt-1 text-xs text-red-300">{errors.displayName}</p>
                  ) : (
                    <p data-error-for="display_name" className="mt-1 text-xs text-red-300 hidden" />
                  )}
                </label>
                <label className="text-sm text-neutral-300">
                  Breed
                  <input
                    name="breed"
                    maxLength={120}
                    autoComplete="off"
                    value={breed}
                    onChange={(event) => setBreed(sanitizeSingleLine(event.target.value, 120, false))}
                    onBlur={() => setBreed((prev) => sanitizeSingleLine(prev, 120, true))}
                    className="mt-1 w-full rounded border border-neutral-700 bg-neutral-900 text-neutral-100 px-3 py-2"
                  />
                  <div className="mt-1 flex items-center justify-between text-xs text-neutral-500">
                    <span>Optional. Max 120 characters.</span>
                    <span data-count-for="breed" aria-live="polite">{breed.length} / 120</span>
                  </div>
                  <p data-error-for="breed" className="mt-1 text-xs text-red-300 hidden"></p>
                </label>
                <label className="text-sm text-neutral-300">
                  Gender
                  <select
                    name="gender"
                    value={gender}
                    onChange={(event) => setGender(event.target.value)}
                    className="mt-1 w-full rounded border border-neutral-700 bg-neutral-900 text-neutral-100 px-3 py-2"
                  >
                    <option value="mare">Mare</option>
                    <option value="stallion">Stallion</option>
                    <option value="gelding">Gelding</option>
                    <option value="unknown">Prefer not to say</option>
                  </select>
                </label>
                <label className="text-sm text-neutral-300">
                  Age (years)
                  <input
                    ref={ageRef}
                    aria-describedby="hint-age"
                    type="number"
                    name="age_years"
                    min={0}
                    max={40}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={ageYears}
                    onChange={(event) => handleNumberChange(event, setAgeYears, "ageYears", 0, 40)}
                    onBlur={() => handleNumberBlur(ageYears, setAgeYears, "ageYears", 0, 40)}
                    className="mt-1 w-full rounded border border-neutral-700 bg-neutral-900 text-neutral-100 px-3 py-2"
                  />
                  <p id="hint-age" className="mt-1 text-xs text-neutral-400">Optional. 0-40.</p>
                  {errors.ageYears ? (
                    <p data-error-for="age_years" className="mt-1 text-xs text-red-300">{errors.ageYears}</p>
                  ) : (
                    <p data-error-for="age_years" className="mt-1 text-xs text-red-300 hidden"></p>
                  )}
                </label>
                <label className="text-sm text-neutral-300">
                  Height (cm)
                  <input
                    ref={heightRef}
                    aria-describedby="hint-height"
                    type="number"
                    name="height_cm"
                    min={50}
                    max={230}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={heightCm}
                    onChange={(event) => handleNumberChange(event, setHeightCm, "heightCm", 50, 230)}
                    onBlur={() => handleNumberBlur(heightCm, setHeightCm, "heightCm", 50, 230)}
                    className="mt-1 w-full rounded border border-neutral-700 bg-neutral-900 text-neutral-100 px-3 py-2"
                  />
                  <p id="hint-height" className="mt-1 text-xs text-neutral-400">Optional. 50-230 cm at withers.</p>
                  {errors.heightCm ? (
                    <p data-error-for="height_cm" className="mt-1 text-xs text-red-300">{errors.heightCm}</p>
                  ) : (
                    <p data-error-for="height_cm" className="mt-1 text-xs text-red-300 hidden"></p>
                  )}
                </label>
                <label className="text-sm text-neutral-300">
                  Color
                  <input
                    name="color"
                    maxLength={64}
                    autoComplete="off"
                    value={color}
                    onChange={(event) => setColor(sanitizeSingleLine(event.target.value, 64, false))}
                    onBlur={() => setColor((prev) => sanitizeSingleLine(prev, 64, true))}
                    className="mt-1 w-full rounded border border-neutral-700 bg-neutral-900 text-neutral-100 px-3 py-2"
                  />
                  <div className="mt-1 flex items-center justify-between text-xs text-neutral-500">
                    <span>Optional. Max 64 characters.</span>
                    <span data-count-for="color" aria-live="polite">{color.length} / 64</span>
                  </div>
                  <p data-error-for="color" className="mt-1 text-xs text-red-300 hidden"></p>
                </label>
                <label className="text-sm text-neutral-300">
                  Temperament
                  <input
                    name="temperament"
                    maxLength={64}
                    autoComplete="off"
                    value={temperament}
                    onChange={(event) => setTemperament(sanitizeSingleLine(event.target.value, 64, false))}
                    onBlur={() => setTemperament((prev) => sanitizeSingleLine(prev, 64, true))}
                    className="mt-1 w-full rounded border border-neutral-700 bg-neutral-900 text-neutral-100 px-3 py-2"
                  />
                  <div className="mt-1 flex items-center justify-between text-xs text-neutral-500">
                    <span>Optional. Max 64 characters.</span>
                    <span data-count-for="temperament" aria-live="polite">{temperament.length} / 64</span>
                  </div>
                  <p data-error-for="temperament" className="mt-1 text-xs text-red-300 hidden"></p>
                </label>
                <label className="sm:col-span-2 text-sm text-neutral-300">
                  Bio
                  <textarea
                    name="bio"
                    maxLength={1000}
                    rows={4}
                    value={bio}
                    onChange={(event) => setBio(sanitizeMultiline(event.target.value, 1000, false))}
                    onBlur={() => setBio((prev) => sanitizeMultiline(prev, 1000, true))}
                    className="mt-1 w-full rounded border border-neutral-700 bg-neutral-900 text-neutral-100 px-3 py-2"
                  />
                  <div className="mt-1 flex items-center justify-between text-xs text-neutral-500">
                    <span>Optional. Up to 1000 characters.</span>
                    <span data-count-for="bio" aria-live="polite">{bio.length} / 1000</span>
                  </div>
                  <p data-error-for="bio" className="mt-1 text-xs text-red-300 hidden"></p>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end">
              <button type="button" id="tfh-next-step-1" onClick={nextFromStepOne} className="px-3 py-1.5 rounded bg-yellow-500 text-black text-sm font-medium hover:bg-yellow-400">
                Continue
              </button>
            </div>
          </div>

          <div className={step === 2 ? "space-y-6" : "space-y-6 hidden"}>
            <div className="rounded-2xl border border-blue-700/40 bg-blue-900/10 p-4">
              <h2 className="text-lg font-semibold text-neutral-200">Location</h2>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="text-sm text-neutral-300">
                  City
                  <input
                    name="location_city"
                    maxLength={120}
                    autoComplete="address-level2"
                    value={locationCity}
                    onChange={(event) => setLocationCity(sanitizeSingleLine(event.target.value, 120, false))}
                    onBlur={() => setLocationCity((prev) => sanitizeSingleLine(prev, 120, true))}
                    className="mt-1 w-full rounded border border-neutral-700 bg-neutral-900 text-neutral-100 px-3 py-2"
                  />
                  <div className="mt-1 flex items-center justify-between text-xs text-neutral-500">
                    <span>Optional. Max 120 characters.</span>
                    <span data-count-for="location_city" aria-live="polite">{locationCity.length} / 120</span>
                  </div>
                  <p data-error-for="location_city" className="mt-1 text-xs text-red-300 hidden"></p>
                </label>
                <label className="text-sm text-neutral-300">
                  Country
                  <input
                    name="location_country"
                    maxLength={120}
                    autoComplete="country-name"
                    value={locationCountry}
                    onChange={(event) => setLocationCountry(sanitizeSingleLine(event.target.value, 120, false))}
                    onBlur={() => setLocationCountry((prev) => sanitizeSingleLine(prev, 120, true))}
                    className="mt-1 w-full rounded border border-neutral-700 bg-neutral-900 text-neutral-100 px-3 py-2"
                  />
                  <div className="mt-1 flex items-center justify-between text-xs text-neutral-500">
                    <span>Optional. Max 120 characters.</span>
                    <span data-count-for="location_country" aria-live="polite">{locationCountry.length} / 120</span>
                  </div>
                  <p data-error-for="location_country" className="mt-1 text-xs text-red-300 hidden"></p>
                </label>
              </div>
            </div>

            <div className="rounded-2xl border border-pink-700/40 bg-pink-900/10 p-4">
              <h2 className="text-lg font-semibold text-neutral-200">Interests &amp; Disciplines</h2>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="text-sm text-neutral-300">
                  Interests (comma-separated)
                  <input
                    ref={interestsRef}
                    aria-describedby="hint-interests"
                    name="interests"
                    maxLength={500}
                    value={interests}
                    onChange={(event) => updateListField(event.target.value, setInterests, "interests", 12, 48, false)}
                    onBlur={() => {
                      const tidy = tidyCommaList(interests, 12, 48);
                      setInterests(tidy);
                      setErrors((prev) => ({ ...prev, interests: validateCommaList(tidy, 12, 48) }));
                    }}
                    className="mt-1 w-full rounded border border-neutral-700 bg-neutral-900 text-neutral-100 px-3 py-2"
                  />
                  <div className="mt-1 flex items-center justify-between text-xs text-neutral-400">
                    <p id="hint-interests" className="leading-snug">e.g., trail rides, grooming, carrots.</p>
                    <span data-count-for="interests" aria-live="polite" className="pl-2 text-neutral-500">{interests.length} / 500</span>
                  </div>
                  {errors.interests ? (
                    <p data-error-for="interests" className="mt-1 text-xs text-red-300">{errors.interests}</p>
                  ) : (
                    <p data-error-for="interests" className="mt-1 text-xs text-red-300 hidden"></p>
                  )}
                </label>
                <label className="text-sm text-neutral-300">
                  Disciplines (comma-separated)
                  <input
                    ref={disciplinesRef}
                    aria-describedby="hint-disciplines"
                    name="disciplines"
                    maxLength={500}
                    value={disciplines}
                    onChange={(event) => updateListField(event.target.value, setDisciplines, "disciplines", 12, 48, false)}
                    onBlur={() => {
                      const tidy = tidyCommaList(disciplines, 12, 48);
                      setDisciplines(tidy);
                      setErrors((prev) => ({ ...prev, disciplines: validateCommaList(tidy, 12, 48) }));
                    }}
                    className="mt-1 w-full rounded border border-neutral-700 bg-neutral-900 text-neutral-100 px-3 py-2"
                  />
                  <div className="mt-1 flex items-center justify-between text-xs text-neutral-400">
                    <p id="hint-disciplines" className="leading-snug">e.g., dressage, jumping, trail.</p>
                    <span data-count-for="disciplines" aria-live="polite" className="pl-2 text-neutral-500">{disciplines.length} / 500</span>
                  </div>
                  {errors.disciplines ? (
                    <p data-error-for="disciplines" className="mt-1 text-xs text-red-300">{errors.disciplines}</p>
                  ) : (
                    <p data-error-for="disciplines" className="mt-1 text-xs text-red-300 hidden"></p>
                  )}
                </label>
              </div>
              <p className="mt-1 text-xs text-neutral-500">We allow up to 12 entries per list and trim anything longer than 48 characters.</p>
            </div>

            <div className="flex items-center justify-between gap-2">
              <button type="button" id="tfh-prev-step-2" onClick={() => { setFormError(null); setStep(1); }} className="px-3 py-1.5 rounded border border-neutral-700 text-neutral-200 hover:bg-neutral-800 text-sm">
                Back
              </button>
              <button type="button" id="tfh-next-step-2" onClick={nextFromStepTwo} className="px-3 py-1.5 rounded bg-yellow-500 text-black text-sm font-medium hover:bg-yellow-400">
                Continue
              </button>
            </div>
          </div>

          <div className={step === 3 ? "space-y-6" : "space-y-6 hidden"}>
            <div className="rounded-2xl border border-neutral-700/40 bg-neutral-900/20 p-4">
              <h2 className="text-lg font-semibold text-neutral-200">Photos</h2>
              <p className="text-xs text-neutral-400 mt-1">Provide image URLs, upload files, or both. Up to 4 photos. The first photo becomes primary automatically. Aim for at least 600px on the longest side and 400px on the shortest.</p>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {photos.map((photo, index) => (
                  <PhotoField
                    key={`${index}-${photo.inputResetKey}`}
                    index={index}
                    state={photo}
                    fileInputRef={(node) => { fileInputRefs.current[index] = node; }}
                    onUrlChange={handlePhotoUrlChange}
                    onUrlBlur={handlePhotoUrlBlur}
                    onFileChange={handlePhotoFileChange}
                    onClear={handlePhotoClear}
                    onDrop={handlePhotoDrop}
                    isPrimary={primaryPhoto === index}
                    onMakePrimary={() => setPrimaryPhoto(index)}
                  />
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-green-700/40 bg-green-900/10 p-4">
              <h2 className="text-lg font-semibold text-neutral-200">Verification</h2>
              <p className="text-xs text-neutral-400 mt-1">Help us prevent spam by completing the captcha.</p>
              <div className="mt-3">
                <div className="h-captcha" data-sitekey="feb4b2b0-056c-4444-b752-faf436125ec0" data-theme="dark" />
              </div>
            </div>

            <input type="hidden" name="primary_photo" value={photoPrimaryValue} />

            <div className="flex items-center justify-between gap-2">
              <button type="button" id="tfh-prev-step-3" onClick={() => { setFormError(null); setStep(2); }} className="px-3 py-1.5 rounded border border-neutral-700 text-neutral-200 hover:bg-neutral-800 text-sm">
                Back
              </button>
              <button
                type="submit"
                id="tfh-save-btn"
                disabled={isSubmitting}
                className="px-3 py-1.5 rounded bg-yellow-500 text-black text-sm font-medium hover:bg-yellow-400 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <span className="inline-flex items-center gap-2">
                  <svg className={`h-4 w-4 ${isSubmitting ? "animate-spin" : "hidden"}`} data-spinner aria-hidden viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a12 12 0 00-12 12h4z"></path>
                  </svg>
                  <span data-label>{submitLabel}</span>
                </span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

type PhotoFieldProps = {
  index: number;
  state: PhotoState;
  isPrimary: boolean;
  onMakePrimary: () => void;
  onUrlChange: (index: number, value: string) => void;
  onUrlBlur: (index: number) => void;
  onFileChange: (index: number, file: File | null) => void;
  onClear: (index: number) => void;
  onDrop: (index: number, event: React.DragEvent<HTMLDivElement>) => void;
  fileInputRef: (node: HTMLInputElement | null) => void;
};

function PhotoField({
  index,
  state,
  isPrimary,
  onMakePrimary,
  onUrlChange,
  onUrlBlur,
  onFileChange,
  onClear,
  onDrop,
  fileInputRef,
}: PhotoFieldProps) {
  const [dragActive, setDragActive] = useState(false);

  const handleFileInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files && event.target.files.length > 0 ? event.target.files[0] : null;
    onFileChange(index, file);
  };

  return (
    <div className="rounded-lg border border-neutral-800 p-3 bg-neutral-900/40">
      <div className="text-sm text-neutral-300 flex items-center justify-between">
        <span>Photo {index + 1}</span>
        <button
          type="button"
          onClick={() => onMakePrimary()}
          className={`text-xs px-2 py-0.5 rounded border ${isPrimary ? "border-yellow-400 text-yellow-300" : "border-neutral-700 text-neutral-300 hover:text-white"}`}
        >
          {isPrimary ? "Primary" : "Make primary"}
        </button>
      </div>
      <div
        id={`tfh-drop-${index}`}
        onDragOver={(event) => { event.preventDefault(); setDragActive(true); }}
        onDragEnter={(event) => { event.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(event) => { setDragActive(false); onDrop(index, event); }}
        className={`mt-2 aspect-[4/3] w-full overflow-hidden rounded-md border border-neutral-800 bg-neutral-950/60 flex items-center justify-center relative transition ${dragActive ? "ring-2 ring-yellow-400/70" : ""}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {(state.previewUrl || state.url) ? (
          <img
            id={`tfh-photo-prev-${index}`}
            alt={`Preview ${index + 1}`}
            src={(state.previewUrl || state.url) as string}
            className="max-h-full max-w-full object-contain transition-opacity duration-200 opacity-100"
          />
        ) : null}
        <div id={`tfh-drop-overlay-${index}`} className={`pointer-events-none absolute inset-0 ${dragActive ? "flex" : "hidden"} items-center justify-center text-xs text-neutral-200 bg-black/30`}>
          Drop image to upload
        </div>
      </div>
      <input
        id={`tfh-photo-url-${index}`}
        type="url"
        name={`photo_${index}`}
        placeholder="https://..."
        value={state.url}
        onChange={(event) => onUrlChange(index, event.target.value)}
        onBlur={() => onUrlBlur(index)}
        className="mt-2 w-full rounded border border-neutral-700 bg-neutral-900 text-neutral-100 px-3 py-2"
      />
      <input
        id={`tfh-photo-file-${index}`}
        key={state.inputResetKey}
        ref={fileInputRef}
        type="file"
        name={`photo_file_${index}`}
        accept="image/*"
        onChange={handleFileInput}
        className="mt-2 w-full text-sm text-neutral-300 file:mr-3 file:rounded file:border-0 file:bg-neutral-800 file:text-neutral-200 file:px-3 file:py-1.5"
      />
      <div className="mt-2 flex items-center justify-between">
        <button type="button" id={`tfh-photo-remove-${index}`} onClick={() => onClear(index)} className="text-xs text-neutral-300 hover:text-white underline underline-offset-2">
          Remove photo
        </button>
      </div>
      {state.error ? (
        <div id={`tfh-photo-err-${index}`} className="mt-1 text-xs text-red-300">{state.error}</div>
      ) : (
        <div id={`tfh-photo-err-${index}`} className="hidden mt-1 text-xs text-red-300" aria-hidden="true"></div>
      )}
    </div>
  );
}
