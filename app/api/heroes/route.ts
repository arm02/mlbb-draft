import { NextResponse } from "next/server";
import { readJsonFileAsync } from "@/lib/data-store";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await readJsonFileAsync("heroes.json");

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to load hero data" }, { status: 500 });
  }
}
