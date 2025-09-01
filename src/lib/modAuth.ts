import crypto from "crypto";

const NAME = "mod_session";
const MAX_AGE_MS = 1000 * 60 * 60 * 8; // 8 hours

function getSecret() {
  const secret = process.env.MODERATION_SESSION_SECRET;
  if (process.env.NODE_ENV === "production") {
    if (!secret) {
      throw new Error("MODERATION_SESSION_SECRET is required in production");
    }
    return secret;
  }
  // In non-production, fall back for local dev convenience
  return secret || process.env.MODERATION_PASS || "dev-secret";
}

export function signSession(user: string) {
  const ts = Date.now().toString();
  const base = `${user}|${ts}`;
  const h = crypto.createHmac("sha256", getSecret()).update(base).digest("hex");
  return `u=${encodeURIComponent(user)};ts=${ts};sig=${h}`;
}

export function verifySession(cookieValue?: string | null): string | null {
  if (!cookieValue) return null;
  try {
    const parts = Object.fromEntries(
      cookieValue.split(";").map((kv) => {
        const [k, ...rest] = kv.split("=");
        return [k.trim(), rest.join("=")];
      })
    ) as any;
    const u = decodeURIComponent(parts.u || "");
    const ts = parts.ts || "";
    const sig = parts.sig || "";
    if (!u || !ts || !sig) return null;
    const expect = crypto.createHmac("sha256", getSecret()).update(`${u}|${ts}`).digest("hex");
    if (crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expect))) {
      // Enforce max session age based on the signed timestamp
      const issued = Number(ts);
      if (!Number.isFinite(issued)) return null;
      if (Date.now() - issued > MAX_AGE_MS) return null;
      return u;
    }
    return null;
  } catch {
    return null;
  }
}

export const SESSION_COOKIE = NAME;
