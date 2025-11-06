"use client";

type ShareNavigator = Navigator & {
  share?: (data: ShareData) => Promise<void>;
  canShare?: (data: ShareData) => boolean;
};

export type ShareResult = "shared" | "copied" | "cancelled" | "failed" | "unsupported";

export const PROFILE_SHARE_TEXT =
  "Check out this profile on secondhorse.nl, a dating app for horses.";

const abortErrorNames = new Set(["AbortError", "NotAllowedError"]);

function buildShareContent(text?: string, url?: string) {
  const parts = [text?.trim(), url?.trim()].filter(Boolean);
  return parts.join("\n");
}

export async function shareWithNativeOrCopy({
  title,
  text,
  url,
  copyContent,
}: {
  title?: string;
  text?: string;
  url?: string;
  copyContent?: string;
}): Promise<ShareResult> {
  if (typeof navigator === "undefined" || typeof window === "undefined") {
    return "unsupported";
  }

  const nav = navigator as ShareNavigator;
  const shareData: ShareData = {};
  if (title) shareData.title = title;
  if (text) shareData.text = text;
  if (url) shareData.url = url;

  if (typeof nav.share === "function") {
    const supported = typeof nav.canShare === "function" ? nav.canShare(shareData) : true;
    if (supported) {
      try {
        await nav.share(shareData);
        return "shared";
      } catch (error: any) {
        if (error && abortErrorNames.has(error.name)) {
          return "cancelled";
        }
      }
    }
  }

  const fallbackContent = copyContent ?? buildShareContent(text, url);
  if (fallbackContent && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(fallbackContent);
      return "copied";
    } catch {}
  }

  return "failed";
}
