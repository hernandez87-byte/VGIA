import {
  createClient as createSupabaseServerClient,
  hasSupabaseServerConfig,
} from "@/lib/supabase/server";

export type NewsMediaType = "article" | "facebook" | "tiktok";
export type NewsTrustLevel = "government";

export interface LocalNewsItem {
  id: string;
  title: string;
  url: string;
  imageUrl?: string;
  sourceId: string;
  sourceName: string;
  sourceSocialUrl: string;
  sourceSocialLabel: "Facebook" | "TikTok" | "Fuente oficial";
  mediaType: NewsMediaType;
  trust: NewsTrustLevel;
  publishedAt?: string;
  publishedLabel?: string;
  isEmergencyRelated: true;
  category: string;
}

export interface LocalNewsSourceStatus {
  id: string;
  name: string;
  siteUrl: string;
  socialUrl: string;
  socialLabel: "Facebook" | "TikTok" | "Fuente oficial";
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
  socialUrl: string;
  socialLabel: "Facebook";
  allowedHosts: string[];
  pathMatches: (pathname: string) => boolean;
  facebookPageId?: string;
}

const RECENT_DAYS = 21;

const NEWS_SOURCES: NewsSourceDefinition[] = [
  {
    id: "pcnl",
    name: "Protección Civil Nuevo León",
    siteUrl: "https://www.nl.gob.mx/es/taxonomy/term/649",
    socialUrl: "https://www.facebook.com/gobiernonuevoleon/",
    socialLabel: "Facebook",
    allowedHosts: ["nl.gob.mx", "www.nl.gob.mx"],
    pathMatches: (pathname) => pathname.startsWith("/es/boletines/"),
    facebookPageId: process.env.META_PCNL_PAGE_ID,
  },
  {
    id: "pc-monterrey",
    name: "Protección Civil Monterrey",
    siteUrl: "https://www.monterrey.gob.mx/noticias/",
    socialUrl: "https://www.facebook.com/SSPCMonterrey/",
    socialLabel: "Facebook",
    allowedHosts: ["monterrey.gob.mx", "www.monterrey.gob.mx"],
    pathMatches: (pathname) => pathname.startsWith("/noticias/"),
    facebookPageId: process.env.META_MONTERREY_SEGURIDAD_PAGE_ID,
  },
];

const NAVIGATION_TEXT = new Set([
  "inicio",
  "ver más",
  "más información",
  "contacto",
  "aviso de privacidad",
  "noticias",
  "protección civil",
  "nuevo león",
  "monterrey",
]);

const EVENT_KEYWORDS = [
  "alerta",
  "aviso preventivo",
  "emergencia",
  "lluvia",
  "tormenta",
  "granizo",
  "inund",
  "desbord",
  "creciente",
  "corriente",
  "arroyo",
  "río",
  "incendio",
  "fuego",
  "humo",
  "accidente",
  "choque",
  "volcadura",
  "cierre vial",
  "bloqueo vial",
  "rescate",
  "evacua",
  "atrapad",
  "sismo",
  "huracán",
  "ciclón",
  "viento fuerte",
  "ráfaga",
  "frente frío",
  "helada",
  "onda de calor",
  "temperatura extrema",
  "altas temperaturas",
  "fuga",
  "derrame",
  "explosión",
  "nube tóxica",
  "contamin",
  "calidad del aire",
  "apagón",
  "sin energía",
  "caída de árbol",
  "socavón",
  "deslave",
  "derrumbe",
  "colapso",
  "presa",
  "desfogue",
  "corte de agua",
  "falta de agua",
  "drenaje",
];

const EXCLUDED_TOPICS = [
  "alcalde",
  "gobernador",
  "diputad",
  "partido",
  "elecci",
  "campaña",
  "cabildo",
  "congreso",
  "reforma",
  "inaugur",
  "capacita",
  "capacitación",
  "curso",
  "taller",
  "simulacro",
  "mesa de trabajo",
  "presenta resultados",
  "reconoce",
  "premia",
  "mundial",
  "fifa",
  "turismo",
  "cultura",
  "concierto",
  "festival",
  "espectáculo",
  "deporte",
  "fútbol",
  "economía",
  "empleo",
];

const CATEGORY_RULES: Array<[string, string[]]> = [
  ["Clima", ["lluvia", "tormenta", "granizo", "huracán", "ciclón", "calor", "viento", "helada", "frente frío"]],
  ["Inundación", ["inund", "corriente", "río", "arroyo", "presa", "desbord", "desfogue"]],
  ["Incendio", ["incendio", "fuego", "humo"]],
  ["Movilidad", ["vial", "choque", "accidente", "volcadura", "bloqueo", "cierre"]],
  ["Rescate", ["rescate", "evacua", "atrapad"]],
  ["Sismo", ["sismo", "terremoto", "réplica"]],
  ["Riesgo químico", ["fuga", "derrame", "explosión", "nube tóxica"]],
  ["Ambiente", ["calidad del aire", "contamin", "ozono", "partículas"]],
  ["Agua", ["agua", "presa", "acueducto", "drenaje"]],
  ["Infraestructura", ["apagón", "energía", "socavón", "derrumbe", "colapso", "árbol"]],
];

const SOCIAL_CATEGORY_LABELS: Record<string, string> = {
  clima: "Clima",
  inundacion: "Inundación",
  incendio: "Incendio",
  movilidad: "Movilidad",
  rescate: "Rescate",
  sismo: "Sismo",
  huracan: "Huracán",
  quimico: "Riesgo químico",
  agua: "Agua",
  infraestructura: "Infraestructura",
  otro: "Protección Civil",
};

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
    title.length >= 20 &&
    title.length <= 280 &&
    !NAVIGATION_TEXT.has(normalized) &&
    !normalized.startsWith("image") &&
    !normalized.includes("activar sonido")
  );
}

function isRelevantEmergencyEvent(title: string): boolean {
  const normalized = title.toLocaleLowerCase("es-MX");
  return (
    EVENT_KEYWORDS.some((keyword) => normalized.includes(keyword)) &&
    !EXCLUDED_TOPICS.some((keyword) => normalized.includes(keyword))
  );
}

function inferCategory(title: string): string {
  const normalized = title.toLocaleLowerCase("es-MX");
  return (
    CATEGORY_RULES.find(([, keywords]) =>
      keywords.some((keyword) => normalized.includes(keyword)),
    )?.[0] ?? "Protección Civil"
  );
}

const MONTHS: Record<string, number> = {
  enero: 0,
  febrero: 1,
  marzo: 2,
  abril: 3,
  mayo: 4,
  junio: 5,
  julio: 6,
  agosto: 7,
  septiembre: 8,
  octubre: 9,
  noviembre: 10,
  diciembre: 11,
};

function formatPublishedDate(value: Date): string {
  return new Intl.DateTimeFormat("es-MX", {
    timeZone: "America/Monterrey",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

function publishedInfoNear(
  html: string,
  index: number,
): { publishedAt?: string; publishedLabel?: string } {
  const context = decodeHtml(html.slice(Math.max(0, index - 260), index + 420));
  const slashDate = context.match(/(?:Publicado el\s*)?(\d{1,2})\/(\d{1,2})\/(\d{4})/i);
  if (slashDate) {
    const date = new Date(
      Date.UTC(Number(slashDate[3]), Number(slashDate[2]) - 1, Number(slashDate[1]), 18),
    );
    return { publishedAt: date.toISOString(), publishedLabel: formatPublishedDate(date) };
  }

  const writtenDate = context.match(
    /(\d{1,2})\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\s+(\d{4})/i,
  );
  if (writtenDate) {
    const month = MONTHS[writtenDate[2].toLocaleLowerCase("es-MX")];
    const date = new Date(Date.UTC(Number(writtenDate[3]), month, Number(writtenDate[1]), 18));
    return { publishedAt: date.toISOString(), publishedLabel: formatPublishedDate(date) };
  }

  return {};
}

function isRecent(publishedAt?: string): boolean {
  if (!publishedAt) return true;
  const timestamp = new Date(publishedAt).getTime();
  return timestamp >= Date.now() - RECENT_DAYS * 24 * 60 * 60 * 1000;
}

function stableItemId(prefix: string, value: string): string {
  return `${prefix}-${encodeURIComponent(value).replace(/%/g, "").slice(-90)}`;
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
  while ((match = anchorPattern.exec(html)) && items.length < 10) {
    const url = absoluteUrl(match[1], source.siteUrl);
    if (!url || seenUrls.has(url)) continue;

    const parsedUrl = new URL(url);
    if (!source.allowedHosts.includes(parsedUrl.hostname)) continue;
    if (!source.pathMatches(parsedUrl.pathname.replace(/\/$/, ""))) continue;

    const title = decodeHtml(match[2]);
    if (!titleLooksUseful(title) || !isRelevantEmergencyEvent(title)) continue;

    const titleKey = title.toLocaleLowerCase("es-MX").replace(/[^a-záéíóúñ0-9]+/g, " ");
    if (seenTitles.has(titleKey)) continue;

    const published = publishedInfoNear(html, match.index);
    if (!isRecent(published.publishedAt)) continue;

    seenUrls.add(url);
    seenTitles.add(titleKey);

    items.push({
      id: stableItemId(source.id, url),
      title,
      url,
      imageUrl: extractImageUrl(match[2], source.siteUrl),
      sourceId: source.id,
      sourceName: source.name,
      sourceSocialUrl: source.socialUrl,
      sourceSocialLabel: source.socialLabel,
      mediaType: "article",
      trust: "government",
      publishedAt: published.publishedAt,
      publishedLabel: published.publishedLabel,
      isEmergencyRelated: true,
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
      "User-Agent": "VIGIA-EmergencyFeed/0.2 (+official civil protection events)",
    },
    next: { revalidate: 300 },
    signal: AbortSignal.timeout(6_000),
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
}

async function fetchFacebookItems(
  source: NewsSourceDefinition,
): Promise<LocalNewsItem[]> {
  const token = process.env.META_PAGE_ACCESS_TOKEN;
  if (!token || !source.facebookPageId) return [];

  const graphVersion = process.env.META_GRAPH_VERSION ?? "v24.0";
  const endpoint = new URL(
    `https://graph.facebook.com/${graphVersion}/${source.facebookPageId}/posts`,
  );
  endpoint.searchParams.set(
    "fields",
    "id,message,created_time,permalink_url,full_picture",
  );
  endpoint.searchParams.set("limit", "12");
  endpoint.searchParams.set("access_token", token);

  const response = await fetch(endpoint, {
    next: { revalidate: 300 },
    signal: AbortSignal.timeout(6_000),
  });
  if (!response.ok) return [];

  const payload = (await response.json()) as { data?: FacebookGraphPost[] };
  return (payload.data ?? [])
    .filter((post) => {
      const title = decodeHtml(post.message ?? "");
      return (
        Boolean(post.permalink_url) &&
        titleLooksUseful(title) &&
        isRelevantEmergencyEvent(title) &&
        isRecent(post.created_time)
      );
    })
    .map((post) => {
      const title = decodeHtml(post.message ?? "").slice(0, 280);
      return {
        id: `facebook-${post.id}`,
        title,
        url: post.permalink_url!,
        imageUrl: post.full_picture,
        sourceId: source.id,
        sourceName: source.name,
        sourceSocialUrl: source.socialUrl,
        sourceSocialLabel: "Facebook",
        mediaType: "facebook",
        trust: "government",
        publishedAt: post.created_time,
        publishedLabel: post.created_time
          ? formatPublishedDate(new Date(post.created_time))
          : undefined,
        isEmergencyRelated: true,
        category: inferCategory(title),
      } satisfies LocalNewsItem;
    });
}

interface OfficialSocialPostRow {
  id: string;
  platform: "tiktok" | "facebook";
  source_name: string;
  source_account_url: string;
  post_url: string;
  title: string;
  category: string;
  published_at: string;
  thumbnail_url: string | null;
}

interface TikTokOEmbedResponse {
  title?: string;
  author_name?: string;
  author_url?: string;
  thumbnail_url?: string;
}

async function fetchTikTokMetadata(url: string): Promise<TikTokOEmbedResponse | null> {
  try {
    const endpoint = new URL("https://www.tiktok.com/oembed");
    endpoint.searchParams.set("url", url);
    const response = await fetch(endpoint, {
      next: { revalidate: 900 },
      signal: AbortSignal.timeout(5_000),
    });
    if (!response.ok) return null;
    return (await response.json()) as TikTokOEmbedResponse;
  } catch {
    return null;
  }
}

async function fetchVerifiedSocialPosts(): Promise<LocalNewsItem[]> {
  if (!hasSupabaseServerConfig()) return [];

  try {
    const supabase = await createSupabaseServerClient();
    const cutoff = new Date(
      Date.now() - RECENT_DAYS * 24 * 60 * 60 * 1000,
    ).toISOString();
    const { data, error } = await supabase
      .from("official_social_posts")
      .select(
        "id,platform,source_name,source_account_url,post_url,title,category,published_at,thumbnail_url",
      )
      .eq("is_verified", true)
      .eq("is_active", true)
      .gte("published_at", cutoff)
      .order("published_at", { ascending: false })
      .limit(16);

    if (error || !data) return [];

    return await Promise.all(
      (data as OfficialSocialPostRow[])
        .filter((row) => isRelevantEmergencyEvent(row.title))
        .map(async (row) => {
          const tiktokMetadata =
            row.platform === "tiktok"
              ? await fetchTikTokMetadata(row.post_url)
              : null;
          const title = decodeHtml(tiktokMetadata?.title ?? row.title).slice(0, 280);

          return {
            id: row.id,
            title,
            url: row.post_url,
            imageUrl: tiktokMetadata?.thumbnail_url ?? row.thumbnail_url ?? undefined,
            sourceId: `social-${row.source_name.toLocaleLowerCase("es-MX").replace(/[^a-z0-9]+/g, "-")}`,
            sourceName: tiktokMetadata?.author_name ?? row.source_name,
            sourceSocialUrl: tiktokMetadata?.author_url ?? row.source_account_url,
            sourceSocialLabel: row.platform === "tiktok" ? "TikTok" : "Facebook",
            mediaType: row.platform,
            trust: "government",
            publishedAt: row.published_at,
            publishedLabel: formatPublishedDate(new Date(row.published_at)),
            isEmergencyRelated: true,
            category: SOCIAL_CATEGORY_LABELS[row.category] ?? "Protección Civil",
          } satisfies LocalNewsItem;
        }),
    );
  } catch {
    return [];
  }
}

function uniqueAndSort(items: LocalNewsItem[]): LocalNewsItem[] {
  const unique = Array.from(
    new Map(items.map((item) => [item.url, item])).values(),
  );

  return unique
    .sort((left, right) => {
      const leftTime = left.publishedAt ? new Date(left.publishedAt).getTime() : 0;
      const rightTime = right.publishedAt ? new Date(right.publishedAt).getTime() : 0;
      return rightTime - leftTime;
    })
    .slice(0, 18);
}

export async function getLocalNewsFeed(): Promise<LocalNewsFeed> {
  const [websiteResults, verifiedSocialPosts] = await Promise.all([
    Promise.all(
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
    ),
    fetchVerifiedSocialPosts(),
  ]);

  const items = uniqueAndSort([
    ...verifiedSocialPosts,
    ...websiteResults.flatMap((result) => result.items),
  ]);
  const socialSources = Array.from(
    new Map(
      verifiedSocialPosts.map((item) => [
        item.sourceId,
        {
          id: item.sourceId,
          name: item.sourceName,
          siteUrl: item.sourceSocialUrl,
          socialUrl: item.sourceSocialUrl,
          socialLabel: item.sourceSocialLabel,
          trust: "government" as const,
          available: true,
          itemCount: verifiedSocialPosts.filter(
            (candidate) => candidate.sourceId === item.sourceId,
          ).length,
        },
      ]),
    ).values(),
  );
  const sources: LocalNewsSourceStatus[] = [
    ...websiteResults.map(({ source, items: sourceItems, available }) => ({
      id: source.id,
      name: source.name,
      siteUrl: source.siteUrl,
      socialUrl: source.socialUrl,
      socialLabel: source.socialLabel,
      trust: "government" as const,
      available,
      itemCount: sourceItems.length,
    })),
    ...socialSources,
  ];
  const availableSources = sources.filter((source) => source.available).length;

  return {
    items,
    sources,
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
        : availableSources === sources.length
          ? "live"
          : "partial",
  };
}
