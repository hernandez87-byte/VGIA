import { NextResponse } from "next/server";
import { getDashboardData } from "@/lib/data/dashboard";

export const dynamic = "force-dynamic";

export async function GET() {
  const dashboard = await getDashboardData();

  return NextResponse.json(dashboard, {
    headers: {
      "Cache-Control": "no-store, max-age=0",
      "X-Vigia-Data-Source": dashboard.source,
    },
  });
}
