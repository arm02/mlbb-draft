import { NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";

export const dynamic = "force-static";

export function GET() {
  try {
    const filePath = join(process.cwd(), "public", "data", "heroes.json");
    const raw = readFileSync(filePath, "utf-8");
    const data = JSON.parse(raw);

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to load hero data" }, { status: 500 });
  }
}
