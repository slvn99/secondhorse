import { describe, it, expect } from "vitest";
import { horses } from "../../src/lib/horses";

describe("horses data", () => {
  it("has at least one entry", () => {
    expect(Array.isArray(horses)).toBe(true);
    expect(horses.length).toBeGreaterThan(0);
  });

  it("contains well-formed profiles", () => {
    const allowedGenders = new Set(["Mare", "Stallion", "Gelding"]);
    for (const h of horses) {
      expect(typeof h.name).toBe("string");
      expect(h.name.length).toBeGreaterThan(0);
      expect(typeof h.age).toBe("number");
      expect(h.age).toBeGreaterThan(0);
      expect(allowedGenders.has(h.gender)).toBe(true);
      expect(typeof h.breed).toBe("string");
      expect(typeof h.location).toBe("string");
      expect(typeof h.heightCm).toBe("number");
      expect(h.heightCm).toBeGreaterThan(0);
      expect(typeof h.image).toBe("string");
    }
  });
});

