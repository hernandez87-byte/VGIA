import { getMetropolitanOfficialFeed } from "@/lib/news/metropolitan-feed";

export const dynamic = "force-dynamic";

export async function GET() {
  const feed = await getMetropolitanOfficialFeed();

  return Response.json(feed, {
    status: feed.mode === "unavailable" ? 503 : 200,
    headers: {
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
    },
  });
}
