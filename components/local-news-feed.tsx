"use client";

import { useMemo, useState } from "react";
import type { LocalNewsFeed, NewsMediaType } from "@/lib/news/local-news";

type NewsFilter = "all" | NewsMediaType;

interface LocalNewsFeedProps {
  feed: LocalNewsFeed;
}

const FILTERS: Array<{ id: NewsFilter; label: string }> = [
  { id: "all", label: "Todos los eventos" },
  { id: "article", label: "Avisos oficiales" },
  { id: "facebook", label: "Facebook oficial" },
  { id: "tiktok", label: "Videos de TikTok" },
];

const OFFICIAL_FACEBOOK_TIMELINES = [
  {
    id: "pcnl-facebook",
    name: "Protección Civil Nuevo León",
    pageUrl: "https://www.facebook.com/proteccioncivilnuevoleon/",
    sourceUrl: "https://www.nl.gob.mx/es/taxonomy/term/173",
  },
  {
    id: "pc-monterrey-facebook",
    name: "Protección Civil Monterrey",
    pageUrl: "https://www.facebook.com/761222200588751/",
    sourceUrl:
      "https://www.monterrey.gob.mx/dependencias/protecci%C3%B3n-civil/",
  },
] as const;

function facebookPluginUrl(pageUrl: string): string {
  const params = new URLSearchParams({
    href: pageUrl,
    tabs: "timeline",
    width: "500",
    height: "650",
    small_header: "true",
    adapt_container_width: "true",
    hide_cover: "false",
    show_facepile: "false",
  });

  return `https://www.facebook.com/plugins/page.php?${params.toString()}`;
}

function mediaLabel(mediaType: NewsMediaType): string {
  if (mediaType === "tiktok") return "TikTok";
  if (mediaType === "facebook") return "Facebook";
  return "Aviso oficial";
}

export function LocalNewsFeed({ feed }: LocalNewsFeedProps) {
  const [filter, setFilter] = useState<NewsFilter>("all");

  const visibleItems = useMemo(() => {
    if (filter === "all") return feed.items;
    return feed.items.filter((item) => item.mediaType === filter);
  }, [feed.items, filter]);

  const showFacebookTimelines = filter === "all" || filter === "facebook";

  return (
    <section className="news-panel" aria-labelledby="metropolitan-news-title">
      <div className="news-panel-header">
        <div>
          <span className="eyebrow">Protección Civil metropolitana</span>
          <h2 id="metropolitan-news-title">Avisos e incidentes recientes</h2>
          <p>
            Solo emergencias, clima severo, incendios, rescates, cierres peligrosos
            y fallas de infraestructura. Los timelines se cargan directamente desde
            las páginas oficiales para no depender de un raspador bloqueado por Meta.
          </p>
        </div>
        <div className="news-feed-status">
          <span className="news-mode news-mode-live">Canales oficiales conectados</span>
          <small>Actualizado {feed.updatedAt}</small>
        </div>
      </div>

      <div className="news-filters" role="group" aria-label="Filtrar avisos oficiales">
        {FILTERS.map((option) => (
          <button
            key={option.id}
            type="button"
            className={filter === option.id ? "news-filter is-active" : "news-filter"}
            onClick={() => setFilter(option.id)}
          >
            {option.label}
          </button>
        ))}
      </div>

      {visibleItems.length > 0 ? (
        <div className="news-grid">
          {visibleItems.slice(0, 12).map((item, index) => (
            <article
              key={item.id}
              className={
                index === 0 && filter === "all"
                  ? "news-card news-card-featured"
                  : "news-card"
              }
            >
              <a
                className="news-card-media"
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Abrir publicación oficial: ${item.title}`}
              >
                {item.imageUrl ? (
                  // Las portadas provienen de fuentes oficiales variables.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.imageUrl}
                    alt=""
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span className="news-card-placeholder" aria-hidden="true">
                    {item.mediaType === "tiktok"
                      ? "♪"
                      : item.mediaType === "facebook"
                        ? "f"
                        : "!"}
                  </span>
                )}
                <span className={`news-media-label news-media-${item.mediaType}`}>
                  {mediaLabel(item.mediaType)}
                </span>
              </a>

              <div className="news-card-body">
                <div className="news-card-meta">
                  <span>{item.sourceName}</span>
                  <span>{item.category}</span>
                  {item.publishedLabel ? <time>{item.publishedLabel}</time> : null}
                </div>
                <h3>
                  <a href={item.url} target="_blank" rel="noopener noreferrer">
                    {item.title}
                  </a>
                </h3>
                <div className="news-card-actions">
                  <a href={item.url} target="_blank" rel="noopener noreferrer">
                    Abrir publicación
                  </a>
                  <a
                    href={item.sourceSocialUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {item.sourceSocialLabel} oficial
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : filter !== "all" && !showFacebookTimelines ? (
        <div className="news-empty-state">
          <strong>No hay publicaciones verificadas para este filtro.</strong>
          <span>
            TikTok solo aparece cuando existe una URL real de una cuenta oficial y
            un operador la valida. Las cuentas supuestas que probamos devolvieron error;
            no se inventará un perfil para llenar espacio.
          </span>
        </div>
      ) : null}

      {showFacebookTimelines ? (
        <div className="official-social-grid" aria-label="Timelines oficiales de Facebook">
          {OFFICIAL_FACEBOOK_TIMELINES.map((timeline) => (
            <article className="official-social-card" key={timeline.id}>
              <div className="official-social-header">
                <div>
                  <span className="source-dot is-online" />
                  <strong>{timeline.name}</strong>
                </div>
                <span>Facebook oficial</span>
              </div>
              <iframe
                className="official-facebook-frame"
                src={facebookPluginUrl(timeline.pageUrl)}
                title={`Publicaciones recientes de ${timeline.name}`}
                width="500"
                height="650"
                loading="lazy"
                allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
              />
              <div className="official-social-links">
                <a href={timeline.pageUrl} target="_blank" rel="noopener noreferrer">
                  Abrir Facebook
                </a>
                <a href={timeline.sourceUrl} target="_blank" rel="noopener noreferrer">
                  Portal oficial
                </a>
              </div>
            </article>
          ))}
        </div>
      ) : null}

      <div className="news-verification-note">
        <strong>Verificación aplicada</strong>
        <span>
          Ambos timelines respondieron correctamente desde un servidor externo antes
          de habilitarse. Facebook puede pedir iniciar sesión según sus propias reglas.
        </span>
      </div>
    </section>
  );
}
