import { getLocalNewsFeed } from "@/lib/news/local-news";

export const dynamic = "force-dynamic";

export async function GET() {
  const feed = await getLocalNewsFeed();

  return Response.json(feed, {
    status: feed.mode === "unavailable" ? 503 : 200,
    headers: {
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
    },
  });
}
