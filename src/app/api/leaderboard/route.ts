import { NextResponse } from "next/server";
import { generateLeaderboard } from "@/lib/leaderboard";


export async function GET() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    return NextResponse.json(
      { error: { message: "Vote leaderboard unavailable: database not configured" } },
      { status: 503 }
    );
  }

  try {
    const data = await generateLeaderboard({ databaseUrl });
    return NextResponse.json(data);
  } catch (error) {
    console.warn("Leaderboard generation failed:", error);
    return NextResponse.json({ error: { message: "Failed to generate leaderboard" } }, { status: 500 });
  }
}
