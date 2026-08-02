"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { LocalNewsFeed, NewsMediaType } from "@/lib/news/local-news";

type NewsFilter = "all" | NewsMediaType;

interface LocalNewsFeedProps {
  feed: LocalNewsFeed;
  compact?: boolean;
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
    sourceUrl: "https://www.monterrey.gob.mx/dependencias/protecci%C3%B3n-civil/",
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

export function LocalNewsFeed({ feed, compact = false }: LocalNewsFeedProps) {
  const [filter, setFilter] = useState<NewsFilter>("all");

  const visibleItems = useMemo(() => {
    const filtered =
      filter === "all"
        ? feed.items
        : feed.items.filter((item) => item.mediaType === filter);
    return compact ? filtered.slice(0, 3) : filtered.slice(0, 18);
  }, [compact, feed.items, filter]);

  return (
    <section
      className={compact ? "news-panel news-panel-compact" : "news-panel news-panel-full"}
      aria-labelledby="metropolitan-news-title"
      id="avisos"
    >
      <div className="news-panel-header">
        <div>
          <span className="eyebrow">Protección Civil metropolitana</span>
          <h2 id="metropolitan-news-title">
            {compact ? "Incidentes oficiales recientes" : "Avisos e incidentes oficiales"}
          </h2>
          <p>
            Emergencias, clima severo, incendios, rescates, cierres peligrosos y fallas
            de infraestructura. Sin política, espectáculos ni relleno editorial.
          </p>
        </div>
        <div className="news-feed-status">
          <span className={`news-mode news-mode-${feed.mode}`}>
            {feed.mode === "unavailable"
              ? "Sin incidentes confirmados"
              : `${feed.items.length} publicaciones verificadas`}
          </span>
          <small>Actualizado {feed.updatedAt}</small>
          {compact ? <Link href="/avisos">Ver todos los avisos →</Link> : null}
        </div>
      </div>

      {!compact ? (
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
      ) : null}

      {visibleItems.length > 0 ? (
        <div className={compact ? "incident-preview-grid" : "news-grid"}>
          {visibleItems.map((item) => (
            <article className={compact ? "incident-preview-card" : "news-card"} key={item.id}>
              <a
                className={compact ? "incident-preview-media" : "news-card-media"}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Abrir publicación oficial: ${item.title}`}
              >
                {item.imageUrl ? (
                  // Las portadas provienen de fuentes oficiales variables.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.imageUrl} alt="" loading="lazy" referrerPolicy="no-referrer" />
                ) : (
                  <span className="news-card-placeholder" aria-hidden="true">
                    {item.mediaType === "tiktok" ? "♪" : item.mediaType === "facebook" ? "f" : "!"}
                  </span>
                )}
                <span className={`news-media-label news-media-${item.mediaType}`}>
                  {mediaLabel(item.mediaType)}
                </span>
              </a>

              <div className={compact ? "incident-preview-body" : "news-card-body"}>
                <div className="news-card-meta">
                  <span>{item.category}</span>
                  {item.publishedLabel ? <time>{item.publishedLabel}</time> : null}
                </div>
                <h3>
                  <a href={item.url} target="_blank" rel="noopener noreferrer">
                    {item.title}
                  </a>
                </h3>
                <div className="incident-source-row">
                  <span>{item.sourceName}</span>
                  <a href={item.url} target="_blank" rel="noopener noreferrer">
                    Ver publicación
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className={compact ? "news-empty-state news-empty-compact" : "news-empty-state"}>
          <span className="empty-check" aria-hidden="true">✓</span>
          <div>
            <strong>No hay incidentes oficiales recientes para este filtro.</strong>
            <span>Última revisión: {feed.updatedAt}. No se muestran notas antiguas para rellenar espacio.</span>
          </div>
        </div>
      )}

      {!compact ? (
        <>
          <details className="official-channel-details">
            <summary>Ver canales oficiales completos de Facebook</summary>
            <p>
              Los timelines provienen directamente de Meta y pueden solicitar inicio de sesión.
            </p>
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
          </details>

          <div className="news-verification-note">
            <strong>Fuentes verificadas</strong>
            <span>
              El contenido social no se convierte automáticamente en una orden de evacuación.
              Las alertas operativas conservan su propia fuente, vigencia y nivel de confianza.
            </span>
          </div>
        </>
      ) : null}
    </section>
  );
}
