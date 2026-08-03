import {
  getLocalNewsFeed,
  type LocalNewsFeed,
  type LocalNewsItem,
  type LocalNewsSourceStatus,
} from "@/lib/news/local-news";

const PCNL_SOURCE = {
  id: "pcnl-operational-v2",
  name: "Protección Civil Nuevo León",
  siteUrl: "https://www.nl.gob.mx/es/taxonomy/term/173",
  socialUrl: "https://www.facebook.com/proteccioncivilnuevoleon/",
} as const;

const RECENT_DAYS = 120;

const STRONG_TERMS = [
  "inund",
  "incendio",
  "rescate",
  "evacua",
  "accidente",
  "choque",
  "volcadura",
  "fuga",
  "derrame",
  "explosión",
  "socavón",
  "deslave",
  "derrumbe",
  "colapso",
  "sismo",
  "terremoto",
  "huracán",
  "ciclón",
  "granizo",
  "desbord",
  "atrapad",
  "cierre vial",
  "drenaje",
  "lluvia",
  "tormenta",
] as const;

const OPERATIONAL_TERMS = [
  "alerta",
  "emergencia",
  "operativo",
  "prevención",
  "protección civil",
  "riesgo",
  "auxilio",
  "presa",
  "río",
  "arroyo",
  "canícula",
  "frente frío",
  "viento fuerte",
  "temporada de ciclones",
  "temporada vacacional",
] as const;

const EXCLUDED_TERMS = [
  "fifa",
  "mundial",
  "concierto",
  "festival",
  "deporte",
  "fútbol",
  "capacitación",
  "capacita",
  "curso",
  "academia",
  "graduación",
  "cadetes",
  "inaugura",
  "reconoce",
  "premia",
  "campaña electoral",
  "cabildo",
  "congreso",
  "albercas",
  "parque españa",
  "reciclaje",
  "aniversario",
  "campamento de verano",
  "convenio",
  "jornada de prevención",
] as const;

const CATEGORY_RULES: Array<[string, readonly string[]]> = [
  ["Inundación", ["inund", "desbord", "corriente", "arroyo", "río", "presa"]],
  ["Incendio", ["incendio", "fuego", "humo"]],
  ["Clima", ["lluvia", "tormenta", "granizo", "huracán", "ciclón", "canícula", "calor", "viento", "frente frío"]],
  ["Movilidad", ["accidente", "choque", "volcadura", "cierre vial", "bloqueo"]],
  ["Rescate", ["rescate", "evacua", "atrapad", "auxilio"]],
  ["Riesgo químico", ["fuga", "derrame", "explosión"]],
  ["Infraestructura", ["socavón", "deslave", "derrumbe", "colapso", "drenaje"]],
];

function cleanHtml(value: string): string {
  return value
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function eventScore(title: string): number {
  const normalized = title.toLocaleLowerCase("es-MX");
  let score = 0;
  for (const term of STRONG_TERMS) if (normalized.includes(term)) score += 3;
  for (const term of OPERATIONAL_TERMS) if (normalized.includes(term)) score += 1;
  for (const term of EXCLUDED_TERMS) if (normalized.includes(term)) score -= 5;
  return score;
}

function inferCategory(title: string): string {
  const normalized = title.toLocaleLowerCase("es-MX");
  return (
    CATEGORY_RULES.find(([, terms]) => terms.some((term) => normalized.includes(term)))?.[0] ??
    "Protección Civil"
  );
}

function absoluteOfficialUrl(value: string): string | null {
  try {
    const url = new URL(value, PCNL_SOURCE.siteUrl);
    if (!["nl.gob.mx", "www.nl.gob.mx"].includes(url.hostname)) return null;
    if (!url.pathname.startsWith("/es/boletines/")) return null;
    url.hash = "";
    return url.toString();
  } catch {
    return null;
  }
}

function dateNear(html: string, index: number): Date | null {
  const context = cleanHtml(html.slice(Math.max(0, index - 280), index + 430));
  const match = context.match(/Publicado el\s*(\d{1,2})\/(\d{1,2})\/(\d{4})/i);
  if (!match) return null;
  return new Date(Date.UTC(Number(match[3]), Number(match[2]) - 1, Number(match[1]), 18));
}

function isRecent(date: Date | null): boolean {
  return Boolean(date && date.getTime() >= Date.now() - RECENT_DAYS * 86_400_000);
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("es-MX", {
    timeZone: "America/Monterrey",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function extractImage(fragment: string): string | undefined {
  const match = fragment.match(/(?:src|data-src|data-lazy-src)=["']([^"']+)["']/i);
  if (!match?.[1] || match[1].startsWith("data:")) return undefined;
  try {
    return new URL(match[1], PCNL_SOURCE.siteUrl).toString();
  } catch {
    return undefined;
  }
}

function parseItems(html: string): LocalNewsItem[] {
  const items: LocalNewsItem[] = [];
  const seen = new Set<string>();
  const anchorPattern = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match: RegExpExecArray | null;

  while ((match = anchorPattern.exec(html)) && items.length < 12) {
    const url = absoluteOfficialUrl(match[1]);
    if (!url || seen.has(url)) continue;

    const title = cleanHtml(match[2]);
    if (title.length < 20 || title.length > 260 || eventScore(title) < 1) continue;

    const published = dateNear(html, match.index);
    if (!isRecent(published)) continue;

    seen.add(url);
    items.push({
      id: `pcnl-${encodeURIComponent(url).replace(/%/g, "").slice(-90)}`,
      title,
      url,
      imageUrl: extractImage(match[2]),
      sourceId: PCNL_SOURCE.id,
      sourceName: PCNL_SOURCE.name,
      sourceSocialUrl: PCNL_SOURCE.socialUrl,
      sourceSocialLabel: "Facebook",
      mediaType: "article",
      trust: "government",
      publishedAt: published?.toISOString(),
      publishedLabel: published ? formatDate(published) : undefined,
      isEmergencyRelated: true,
      category: inferCategory(title),
    });
  }

  return items;
}

async function fetchOfficialItems(): Promise<LocalNewsItem[]> {
  try {
    const response = await fetch(PCNL_SOURCE.siteUrl, {
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "es-MX,es;q=0.9",
        "User-Agent": "VIGIA-MetropolitanFeed/1.0",
      },
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) return [];
    return parseItems(await response.text());
  } catch {
    return [];
  }
}

function uniqueAndSort(items: LocalNewsItem[]): LocalNewsItem[] {
  return Array.from(new Map(items.map((item) => [item.url, item])).values())
    .sort((left, right) => {
      const leftTime = left.publishedAt ? new Date(left.publishedAt).getTime() : 0;
      const rightTime = right.publishedAt ? new Date(right.publishedAt).getTime() : 0;
      return rightTime - leftTime;
    })
    .slice(0, 18);
}

export async function getMetropolitanOfficialFeed(): Promise<LocalNewsFeed> {
  const [baseFeed, officialItems] = await Promise.all([
    getLocalNewsFeed(),
    fetchOfficialItems(),
  ]);

  const verifiedSocial = baseFeed.items.filter((item) => item.mediaType !== "article");
  const items = uniqueAndSort([...officialItems, ...verifiedSocial]);
  const socialSources = baseFeed.sources.filter(
    (source) => !["pcnl", "pc-monterrey"].includes(source.id),
  );
  const officialSource: LocalNewsSourceStatus = {
    id: PCNL_SOURCE.id,
    name: PCNL_SOURCE.name,
    siteUrl: PCNL_SOURCE.siteUrl,
    socialUrl: PCNL_SOURCE.socialUrl,
    socialLabel: "Facebook",
    trust: "government",
    available: officialItems.length > 0,
    itemCount: officialItems.length,
  };

  return {
    items,
    sources: [officialSource, ...socialSources],
    updatedAt: new Intl.DateTimeFormat("es-MX", {
      timeZone: "America/Monterrey",
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "short",
    }).format(new Date()),
    mode: items.length > 0 ? "live" : baseFeed.mode,
  };
}
