import { NextResponse } from "next/server";
import { loadHorseForProfileKey } from "@/lib/profileLookup";

export async function GET(
  _request: Request,
  context: { params: Promise<{ key?: string }> }
) {
  const { key: rawKey } = await context.params;
  if (!rawKey) {
    return NextResponse.json({ error: "Profile key is required" }, { status: 400 });
  }

  try {
    const { horse, identifier } = await loadHorseForProfileKey(rawKey);
    if (!horse || !identifier) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }
    return NextResponse.json(
      { horse, source: identifier.source } as const,
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed to load profile", error);
    return NextResponse.json({ error: "Failed to load profile" }, { status: 500 });
  }
}
