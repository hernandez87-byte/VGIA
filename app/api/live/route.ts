import { getLiveSnapshot } from "@/lib/data-sources/live-snapshot";

export const dynamic = "force-dynamic";

export async function GET() {
  const snapshot = await getLiveSnapshot();
  const degraded = snapshot.sources.some((source) => source.status === "degraded");

  return Response.json(snapshot, {
    status: degraded ? 206 : 200,
    headers: {
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
    },
  });
}
