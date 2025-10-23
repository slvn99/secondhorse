export type ProfileSource = "db" | "seed";

export type ProfileIdentifier =
  | { dbId: string }
  | { seedId: string }
  | { seedName: string };

export type NormalizedProfileIdentifier = {
  key: string;
  source: ProfileSource;
  id: string;
};

const UUID_REGEX =
  /^[{(]?[0-9a-fA-F]{8}[-]?[0-9a-fA-F]{4}[-]?[0-9a-fA-F]{4}[-]?[0-9a-fA-F]{4}[-]?[0-9a-fA-F]{12}[)}]?$/;

function assertString(value: unknown, label: string): string {
  if (typeof value !== "string") {
    throw new Error(`${label} must be a string`);
  }
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error(`${label} must not be empty`);
  }
  return trimmed;
}

function normalizeHex(value: string, label: string): string {
  const cleaned = assertString(value, label).toLowerCase();
  if (!/^[0-9a-f]+$/.test(cleaned)) {
    throw new Error(`${label} must be hexadecimal`);
  }
  return cleaned;
}

export function stableIdForName(name: string): string {
  const input = assertString(name, "name");
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash ^ input.charCodeAt(i)) * 16777619;
  }
  const unsigned = hash >>> 0;
  return unsigned.toString(16);
}

export function normalizeProfileIdentifier(
  identifier: ProfileIdentifier
): NormalizedProfileIdentifier {
  if ("dbId" in identifier) {
    const id = assertString(identifier.dbId, "dbId");
    if (!UUID_REGEX.test(id)) {
      throw new Error("dbId must be a valid UUID string");
    }
    return { key: `db:${id.toLowerCase()}`, source: "db", id: id.toLowerCase() };
  }
  if ("seedId" in identifier) {
    const id = normalizeHex(identifier.seedId, "seedId");
    return { key: `seed:${id}`, source: "seed", id };
  }
  if ("seedName" in identifier) {
    const id = stableIdForName(identifier.seedName);
    return { key: `seed:${id}`, source: "seed", id };
  }
  throw new Error("Unsupported profile identifier");
}

export function parseProfileKey(key: string): NormalizedProfileIdentifier {
  const value = assertString(key, "profile key");
  if (value.startsWith("db:")) {
    const id = value.slice(3);
    if (!UUID_REGEX.test(id)) {
      throw new Error("profile key contains invalid db identifier");
    }
    return { key: `db:${id.toLowerCase()}`, source: "db", id: id.toLowerCase() };
  }
  if (value.startsWith("seed:")) {
    const id = normalizeHex(value.slice(5), "profile key seed identifier");
    return { key: `seed:${id}`, source: "seed", id };
  }
  throw new Error("profile key must start with db: or seed:");
}

type IdentifierOptions = {
  type?: ProfileSource;
  seedName?: string;
};

function stripPrefix(raw: string): { value: string; prefixType?: ProfileSource } {
  if (raw.startsWith("db:")) {
    return { value: raw.slice(3), prefixType: "db" };
  }
  if (raw.startsWith("seed:")) {
    return { value: raw.slice(5), prefixType: "seed" };
  }
  return { value: raw, prefixType: undefined };
}

export function inferProfileIdentifier(
  rawId: string,
  options: IdentifierOptions = {}
): ProfileIdentifier {
  const cleaned = assertString(rawId, "profile id");
  const { value, prefixType } = stripPrefix(cleaned);
  const explicitType = options.type ?? prefixType;

  if (explicitType === "db") {
    if (!UUID_REGEX.test(value)) {
      throw new Error("profile id must be a valid UUID when type is db");
    }
    return { dbId: value };
  }

  if (explicitType === "seed") {
    const id = normalizeHex(value, "profile seed id");
    if (options.seedName) {
      const expected = stableIdForName(options.seedName);
      if (expected !== id) {
        throw new Error("seedName does not match the provided profile id");
      }
    }
    return { seedId: id };
  }

  if (UUID_REGEX.test(value)) {
    return { dbId: value };
  }

  return { seedId: normalizeHex(value, "profile seed id") };
}
