export type NewsMediaType = "article" | "video" | "facebook";
export type NewsTrustLevel = "government" | "verified-media";

export interface LocalNewsItem {
  id: string;
  title: string;
  url: string;
  imageUrl?: string;
  sourceId: string;
  sourceName: string;
  sourceFacebookUrl: string;
  mediaType: NewsMediaType;
  trust: NewsTrustLevel;
  publishedAt?: string;
  publishedLabel?: string;
  isEmergencyRelated: boolean;
  category: string;
}

export interface LocalNewsSourceStatus {
  id: string;
  name: string;
  siteUrl: string;
  facebookUrl: string;
  trust: NewsTrustLevel;
  available: boolean;
  itemCount: number;
}

export interface LocalNewsFeed {
  items: LocalNewsItem[];
  sources: LocalNewsSourceStatus[];
  updatedAt: string;
  mode: "live" | "partial" | "unavailable";
}

interface NewsSourceDefinition {
  id: string;
  name: string;
  siteUrl: string;
  facebookUrl: string;
  trust: NewsTrustLevel;
  allowedHosts: string[];
  pathMatches: (pathname: string) => boolean;
  facebookPageId?: string;
}

const NEWS_SOURCES: NewsSourceDefinition[] = [
  {
    id: "pcnl",
    name: "Protección Civil Nuevo León",
    siteUrl: "https://www.nl.gob.mx/es/taxonomy/term/649",
    facebookUrl: "https://www.facebook.com/gobiernonuevoleon/",
    trust: "government",
    allowedHosts: ["nl.gob.mx", "www.nl.gob.mx"],
    pathMatches: (pathname) => pathname.startsWith("/es/boletines/"),
    facebookPageId: process.env.META_PCNl_PAGE_ID,
  },
  {
    id: "telediario-mty",
    name: "Telediario Monterrey",
    siteUrl: "https://www.telediario.mx/monterrey",
    facebookUrl: "https://www.facebook.com/Telediariomty/",
    trust: "verified-media",
    allowedHosts: ["telediario.mx", "www.telediario.mx"],
    pathMatches: (pathname) => {
      const blocked = [
        "/monterrey",
        "/ultima-hora",
        "/policia",
        "/espectaculos",
        "/tendencias",
        "/deportes",
      ];
      return pathname.split("/").filter(Boolean).length >= 2 && !blocked.includes(pathname);
    },
    facebookPageId: process.env.META_TELEDIARIO_PAGE_ID,
  },
  {
    id: "info7",
    name: "INFO7",
    siteUrl: "https://www.info7.mx/",
    facebookUrl: "https://www.facebook.com/Info7mty/",
    trust: "verified-media",
    allowedHosts: ["info7.mx", "www.info7.mx"],
    pathMatches: (pathname) => {
      const segments = pathname.split("/").filter(Boolean);
      return segments.length >= 3 && !pathname.startsWith("/reporte");
    },
    facebookPageId: process.env.META_INFO7_PAGE_ID,
  },
  {
    id: "abc-noticias",
    name: "ABCNoticias.mx",
    siteUrl: "https://abcnoticias.mx/local/",
    facebookUrl: "https://www.facebook.com/abcnoticiasmty/",
    trust: "verified-media",
    allowedHosts: ["abcnoticias.mx", "www.abcnoticias.mx"],
    pathMatches: (pathname) => {
      const segments = pathname.split("/").filter(Boolean);
      return segments.length >= 2 && !pathname.endsWith("/local");
    },
    facebookPageId: process.env.META_ABC_PAGE_ID,
  },
];

const NAVIGATION_TEXT = new Set([
  "inicio",
  "ver más",
  "más información",
  "contacto",
  "aviso de privacidad",
  "última hora",
  "local",
  "nuevo león",
  "deportes",
  "espectáculos",
  "nacional",
  "internacional",
  "policía",
  "política",
  "economía",
  "opinión",
  "televisión",
]);

const EMERGENCY_KEYWORDS = [
  "alerta",
  "lluvia",
  "inund",
  "incendio",
  "accidente",
  "choque",
  "bloqueo",
  "cierre",
  "protección civil",
  "evacua",
  "rescate",
  "desaparec",
  "balacera",
  "sismo",
  "huracán",
  "tormenta",
  "granizo",
  "viento",
  "calor",
  "agua",
  "río",
  "presa",
  "fuga",
  "contamin",
  "calidad del aire",
  "vial",
  "metro",
];

const CATEGORY_RULES: Array<[string, string[]]> = [
  ["Clima", ["lluvia", "tormenta", "granizo", "huracán", "calor", "viento"]],
  ["Inundación", ["inund", "corriente", "río", "arroyo", "presa"]],
  ["Incendio", ["incendio", "fuego", "humo"]],
  ["Movilidad", ["vial", "choque", "accidente", "bloqueo", "cierre", "metro"]],
  ["Seguridad", ["balacera", "detienen", "homicidio", "desaparec", "robo"]],
  ["Protección Civil", ["protección civil", "rescate", "evacua", "alerta"]],
  ["Ambiente", ["calidad del aire", "contamin", "ozono", "partículas"]],
  ["Agua", ["agua", "presa", "acueducto", "drenaje"]],
];

function decodeHtml(value: string): string {
  return value
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&apos;|&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) =>
      String.fromCodePoint(Number.parseInt(code, 16)),
    )
    .replace(/\s+/g, " ")
    .trim();
}

function absoluteUrl(value: string, baseUrl: string): string | null {
  try {
    const url = new URL(value, baseUrl);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    url.hash = "";
    return url.toString();
  } catch {
    return null;
  }
}

function extractImageUrl(fragment: string, baseUrl: string): string | undefined {
  const match = fragment.match(
    /(?:src|data-src|data-lazy-src)=["']([^"']+)["']/i,
  );
  if (!match?.[1] || match[1].startsWith("data:")) return undefined;
  return absoluteUrl(match[1], baseUrl) ?? undefined;
}

function titleLooksUseful(title: string): boolean {
  const normalized = title.toLocaleLowerCase("es-MX");
  return (
    title.length >= 28 &&
    title.length <= 220 &&
    !NAVIGATION_TEXT.has(normalized) &&
    !normalized.startsWith("image") &&
    !normalized.includes("activar sonido")
  );
}

function inferCategory(title: string): string {
  const normalized = title.toLocaleLowerCase("es-MX");
  return (
    CATEGORY_RULES.find(([, keywords]) =>
      keywords.some((keyword) => normalized.includes(keyword)),
    )?.[0] ?? "Local"
  );
}

function isEmergencyRelated(title: string): boolean {
  const normalized = title.toLocaleLowerCase("es-MX");
  return EMERGENCY_KEYWORDS.some((keyword) => normalized.includes(keyword));
}

function inferMediaType(title: string, url: string): NewsMediaType {
  const normalized = `${title} ${url}`.toLocaleLowerCase("es-MX");
  return /\bvideo\b|en vivo|\/videos?\/|\/television\//.test(normalized)
    ? "video"
    : "article";
}

function publishedLabelNear(html: string, index: number): string | undefined {
  const context = decodeHtml(html.slice(Math.max(0, index - 180), index + 260));
  const date = context.match(/Publicado el\s+(\d{1,2}\/\d{1,2}\/\d{4})/i)?.[1];
  if (date) return date;
  const time = context.match(/(?:^|\s)([01]?\d|2[0-3]):[0-5]\d(?:\s|$)/)?.[0]?.trim();
  return time;
}

function parseWebsiteItems(
  html: string,
  source: NewsSourceDefinition,
): LocalNewsItem[] {
  const items: LocalNewsItem[] = [];
  const seenUrls = new Set<string>();
  const seenTitles = new Set<string>();
  const anchorPattern = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;

  let match: RegExpExecArray | null;
  while ((match = anchorPattern.exec(html)) && items.length < 14) {
    const url = absoluteUrl(match[1], source.siteUrl);
    if (!url || seenUrls.has(url)) continue;

    const parsedUrl = new URL(url);
    if (!source.allowedHosts.includes(parsedUrl.hostname)) continue;
    if (!source.pathMatches(parsedUrl.pathname.replace(/\/$/, ""))) continue;

    const title = decodeHtml(match[2]);
    if (!titleLooksUseful(title)) continue;

    const titleKey = title.toLocaleLowerCase("es-MX").replace(/[^a-záéíóúñ0-9]+/g, " ");
    if (seenTitles.has(titleKey)) continue;

    seenUrls.add(url);
    seenTitles.add(titleKey);

    items.push({
      id: `${source.id}-${Buffer.from(url).toString("base64url").slice(0, 24)}`,
      title,
      url,
      imageUrl: extractImageUrl(match[2], source.siteUrl),
      sourceId: source.id,
      sourceName: source.name,
      sourceFacebookUrl: source.facebookUrl,
      mediaType: inferMediaType(title, url),
      trust: source.trust,
      publishedLabel: publishedLabelNear(html, match.index),
      isEmergencyRelated: isEmergencyRelated(title),
      category: inferCategory(title),
    });
  }

  return items;
}

async function fetchWebsiteSource(source: NewsSourceDefinition): Promise<LocalNewsItem[]> {
  const response = await fetch(source.siteUrl, {
    headers: {
      Accept: "text/html,application/xhtml+xml",
      "Accept-Language": "es-MX,es;q=0.9",
      "User-Agent": "VIGIA-NewsBot/0.1 (+local emergency information aggregator)",
    },
    next: { revalidate: 300 },
    signal: AbortSignal.timeout(8_000),
  });

  if (!response.ok) {
    throw new Error(`${source.name} respondió ${response.status}`);
  }

  return parseWebsiteItems(await response.text(), source);
}

interface FacebookGraphPost {
  id: string;
  message?: string;
  created_time?: string;
  permalink_url?: string;
  full_picture?: string;
  attachments?: {
    data?: Array<{ media_type?: string; type?: string }>;
  };
}

async function fetchFacebookItems(
  source: NewsSourceDefinition,
): Promise<LocalNewsItem[]> {
  const token = process.env.META_PAGE_ACCESS_TOKEN;
  if (!token || !source.facebookPageId) return [];

  const graphVersion = process.env.META_GRAPH_VERSION ?? "v24.0";
  const fields = [
    "id",
    "message",
    "created_time",
    "permalink_url",
    "full_picture",
    "attachments{media_type,type}",
  ].join(",");
  const endpoint = new URL(
    `https://graph.facebook.com/${graphVersion}/${source.facebookPageId}/posts`,
  );
  endpoint.searchParams.set("fields", fields);
  endpoint.searchParams.set("limit", "6");
  endpoint.searchParams.set("access_token", token);

  const response = await fetch(endpoint, {
    next: { revalidate: 300 },
    signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok) return [];

  const payload = (await response.json()) as { data?: FacebookGraphPost[] };
  return (payload.data ?? [])
    .filter((post) => post.message && post.permalink_url)
    .map((post) => {
      const title = decodeHtml(post.message ?? "").slice(0, 220);
      const attachment = post.attachments?.data?.[0];
      const mediaType =
        attachment?.media_type === "video" || attachment?.type?.includes("video")
          ? "video"
          : "facebook";

      return {
        id: `facebook-${post.id}`,
        title,
        url: post.permalink_url!,
        imageUrl: post.full_picture,
        sourceId: source.id,
        sourceName: source.name,
        sourceFacebookUrl: source.facebookUrl,
        mediaType,
        trust: source.trust,
        publishedAt: post.created_time,
        publishedLabel: post.created_time
          ? new Intl.DateTimeFormat("es-MX", {
              day: "2-digit",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            }).format(new Date(post.created_time))
          : undefined,
        isEmergencyRelated: isEmergencyRelated(title),
        category: inferCategory(title),
      } satisfies LocalNewsItem;
    });
}

function interleave(sourceItems: LocalNewsItem[][]): LocalNewsItem[] {
  const output: LocalNewsItem[] = [];
  const maximumLength = Math.max(0, ...sourceItems.map((items) => items.length));

  for (let index = 0; index < maximumLength; index += 1) {
    sourceItems.forEach((items) => {
      const item = items[index];
      if (item) output.push(item);
    });
  }

  return output;
}

export async function getLocalNewsFeed(): Promise<LocalNewsFeed> {
  const results = await Promise.all(
    NEWS_SOURCES.map(async (source) => {
      try {
        const [websiteItems, facebookItems] = await Promise.all([
          fetchWebsiteSource(source),
          fetchFacebookItems(source),
        ]);
        const items = [...facebookItems, ...websiteItems].slice(0, 10);
        return { source, items, available: items.length > 0 };
      } catch {
        return { source, items: [] as LocalNewsItem[], available: false };
      }
    }),
  );

  const combined = interleave(results.map((result) => result.items));
  const unique = Array.from(
    new Map(combined.map((item) => [item.url, item])).values(),
  ).slice(0, 16);
  const availableSources = results.filter((result) => result.available).length;

  return {
    items: unique,
    sources: results.map(({ source, items, available }) => ({
      id: source.id,
      name: source.name,
      siteUrl: source.siteUrl,
      facebookUrl: source.facebookUrl,
      trust: source.trust,
      available,
      itemCount: items.length,
    })),
    updatedAt: new Intl.DateTimeFormat("es-MX", {
      timeZone: "America/Monterrey",
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "short",
    }).format(new Date()),
    mode:
      availableSources === 0
        ? "unavailable"
        : availableSources === NEWS_SOURCES.length
          ? "live"
          : "partial",
  };
}
