import { NextRequest, NextResponse } from "next/server";
import { writeFileSync } from "fs";
import { join } from "path";

const FALLBACK_DATA_URL =
  "https://raw.githubusercontent.com/nicholasgasior/mlbb-data/master/heroes.json";

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");

  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const res = await fetch(FALLBACK_DATA_URL, { next: { revalidate: 0 } });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch upstream data" },
        { status: 502 }
      );
    }

    const data = await res.json();
    const filePath = join(process.cwd(), "public", "data", "heroes.json");
    writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");

    return NextResponse.json({
      success: true,
      count: Array.isArray(data) ? data.length : 0,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
