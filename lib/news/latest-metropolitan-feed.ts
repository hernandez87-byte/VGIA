import { getMetropolitanOfficialFeed } from "@/lib/news/metropolitan-feed";
import type { LocalNewsFeed, LocalNewsItem } from "@/lib/news/local-news";

const MAX_AGE_MS = 72 * 60 * 60 * 1000;

function isWithinLatestWindow(item: LocalNewsItem, now: number): boolean {
  if (!item.publishedAt) return false;
  const published = new Date(item.publishedAt).getTime();
  return Number.isFinite(published) && published <= now && published >= now - MAX_AGE_MS;
}

export async function getLatestMetropolitanFeed(): Promise<LocalNewsFeed> {
  const feed = await getMetropolitanOfficialFeed();
  const now = Date.now();
  const items = feed.items.filter((item) => isWithinLatestWindow(item, now));

  return {
    ...feed,
    items,
    mode: items.length > 0 ? "live" : "unavailable",
  };
}
