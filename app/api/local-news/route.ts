import { getLatestMetropolitanFeed } from "@/lib/news/latest-metropolitan-feed";

export const dynamic = "force-dynamic";

export async function GET() {
  const feed = await getLatestMetropolitanFeed();

  return Response.json(feed, {
    status: 200,
    headers: {
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
    },
  });
}
