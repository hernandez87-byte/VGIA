import {
  getLocalNewsFeed,
  type LocalNewsFeed,
  type LocalNewsItem,
  type LocalNewsSourceStatus,
} from "@/lib/news/local-news";

const SOURCE = {
  id: "pcnl-operational",
  name: "Protección Civil Nuevo León",
  siteUrl: "https://www.nl.gob.mx/es/taxonomy/term/173",
  socialUrl: "https://www.facebook.com/proteccioncivilnuevoleon/",
} as const;

const MAX_AGE_DAYS = 45;

const STRONG_EVENT_TERMS = [
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
  "drenaje pluvial",
  "afectaciones tras lluvias",
] as const;

const OPERATIONAL_TERMS = [
  "alerta",
  "emergencia",
  "operativo",
  "prevención",
  "protección civil",
  "lluvia",
  "tormenta",
  "canícula",
  "calor extremo",
  "frente frío",
  "viento fuerte",
  "riesgo",
  "auxilio",
  "presa",
  "río",
  "arroyo",
  "canal pluvial",
  "falta de agua",
  "corte de agua",
] as const;

const EXCLUDED_TERMS = [
  "fifa",
  "mundial",
  "concierto",
  "festival",
  "deporte",
  "fútbol",
  "capacitación",
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

function toAbsoluteUrl(value: string): string | null {
  try {
    const url = new URL(value, SOURCE.siteUrl);
    if (!["nl.gob.mx", "www.nl.gob.mx"].includes(url.hostname)) return null;
    if (!url.pathname.startsWith("/es/boletines/")) return null;
    url.hash = "";
    return url.toString();
  } catch {
    return null;
  }
}

function eventScore(title: string): number {
  const normalized = title.toLocaleLowerCase("es-MX");
  let score = 0;

  for (const term of STRONG_EVENT_TERMS) {
    if (normalized.includes(term)) score += 3;
  }
  for (const term of OPERATIONAL_TERMS) {
    if (normalized.includes(term)) score += 1;
  }
  for (const term of EXCLUDED_TERMS) {
    if (normalized.includes(term)) score -= 4;
  }

  return score;
}

function inferCategory(title: string): string {
  const normalized = title.toLocaleLowerCase("es-MX");
  return (
    CATEGORY_RULES.find(([, terms]) =>
      terms.some((term) => normalized.includes(term)),
    )?.[0] ?? "Protección Civil"
  );
}

function dateNear(html: string, index: number): Date | null {
  const context = cleanHtml(html.slice(Math.max(0, index - 240), index + 360));
  const match = context.match(/Publicado el\s*(\d{1,2})\/(\d{1,2})\/(\d{4})/i);
  if (!match) return null;

  return new Date(
    Date.UTC(Number(match[3]), Number(match[2]) - 1, Number(match[1]), 18),
  );
}

function isRecent(date: Date | null): boolean {
  if (!date) return false;
  return date.getTime() >= Date.now() - MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
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
  const match = fragment.match(
    /(?:src|data-src|data-lazy-src)=["']([^"']+)["']/i,
  );
  if (!match?.[1] || match[1].startsWith("data:")) return undefined;

  try {
    return new URL(match[1], SOURCE.siteUrl).toString();
  } catch {
    return undefined;
  }
}

function parseOfficialItems(html: string): LocalNewsItem[] {
  const items: LocalNewsItem[] = [];
  const seen = new Set<string>();
  const anchorPattern = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;

  let match: RegExpExecArray | null;
  while ((match = anchorPattern.exec(html)) && items.length < 8) {
    const url = toAbsoluteUrl(match[1]);
    if (!url || seen.has(url)) continue;

    const title = cleanHtml(match[2]);
    if (title.length < 20 || title.length > 240 || eventScore(title) < 1) continue;

    const published = dateNear(html, match.index);
    if (!isRecent(published)) continue;

    seen.add(url);
    items.push({
      id: `pcnl-${encodeURIComponent(url).replace(/%/g, "").slice(-90)}`,
      title,
      url,
      imageUrl: extractImage(match[2]),
      sourceId: SOURCE.id,
      sourceName: SOURCE.name,
      sourceSocialUrl: SOURCE.socialUrl,
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

async function fetchOfficialOperationalItems(): Promise<LocalNewsItem[]> {
  try {
    const response = await fetch(SOURCE.siteUrl, {
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "es-MX,es;q=0.9",
        "User-Agent": "VIGIA-OfficialFeed/0.3",
      },
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(8_000),
    });

    if (!response.ok) return [];
    return parseOfficialItems(await response.text());
  } catch {
    return [];
  }
}

function mergeItems(items: LocalNewsItem[]): LocalNewsItem[] {
  return Array.from(new Map(items.map((item) => [item.url, item])).values())
    .sort((left, right) => {
      const leftTime = left.publishedAt ? new Date(left.publishedAt).getTime() : 0;
      const rightTime = right.publishedAt ? new Date(right.publishedAt).getTime() : 0;
      return rightTime - leftTime;
    })
    .slice(0, 18);
}

function mergeSources(
  sources: LocalNewsSourceStatus[],
  itemCount: number,
): LocalNewsSourceStatus[] {
  const corrected = sources.filter((source) => source.id !== "pcnl");
  return [
    {
      id: SOURCE.id,
      name: SOURCE.name,
      siteUrl: SOURCE.siteUrl,
      socialUrl: SOURCE.socialUrl,
      socialLabel: "Facebook",
      trust: "government",
      available: itemCount > 0,
      itemCount,
    },
    ...corrected,
  ];
}

export async function getVerifiedOfficialFeed(): Promise<LocalNewsFeed> {
  const [baseFeed, operationalItems] = await Promise.all([
    getLocalNewsFeed(),
    fetchOfficialOperationalItems(),
  ]);

  const items = mergeItems([...operationalItems, ...baseFeed.items]);
  const sources = mergeSources(baseFeed.sources, operationalItems.length);

  return {
    ...baseFeed,
    items,
    sources,
    mode: items.length > 0 ? "live" : baseFeed.mode,
  };
}
