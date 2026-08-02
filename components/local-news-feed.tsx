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
  { id: "tiktok", label: "Videos de TikTok" },
  { id: "facebook", label: "Facebook oficial" },
];

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

  return (
    <section className="news-panel" aria-labelledby="metropolitan-news-title">
      <div className="news-panel-header">
        <div>
          <span className="eyebrow">Protección Civil metropolitana</span>
          <h2 id="metropolitan-news-title">Avisos e incidentes recientes</h2>
          <p>
            Solo emergencias, fenómenos meteorológicos, incendios, rescates,
            cierres peligrosos y fallas de infraestructura publicados por fuentes
            oficiales. Política, espectáculos, deportes y noticias generales quedan fuera.
          </p>
        </div>
        <div className="news-feed-status">
          <span className={`news-mode news-mode-${feed.mode}`}>
            {feed.mode === "live"
              ? "Fuentes oficiales conectadas"
              : feed.mode === "partial"
                ? "Conexión parcial"
                : "Sin incidentes confirmados"}
          </span>
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
              className={index === 0 && filter === "all" ? "news-card news-card-featured" : "news-card"}
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
                  <img src={item.imageUrl} alt="" loading="lazy" referrerPolicy="no-referrer" />
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
                    aria-label={`Abrir ${item.sourceSocialLabel} oficial de ${item.sourceName}`}
                  >
                    {item.sourceSocialLabel} oficial
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="news-empty-state">
          <strong>No hay incidentes recientes para este filtro.</strong>
          <span>
            La ausencia de publicaciones es preferible a rellenar el tablero con política,
            entretenimiento o notas antiguas que ya no sirven para tomar decisiones.
          </span>
        </div>
      )}

      <div className="news-sources" aria-label="Fuentes oficiales conectadas">
        {feed.sources.map((source) => (
          <div key={source.id} className="news-source">
            <span className={source.available ? "source-dot is-online" : "source-dot"} />
            <div>
              <strong>{source.name}</strong>
              <small>
                Fuente gubernamental
                {source.itemCount > 0
                  ? ` · ${source.itemCount} eventos recientes`
                  : " · sin eventos recientes"}
              </small>
            </div>
            <div className="news-source-links">
              <a href={source.siteUrl} target="_blank" rel="noopener noreferrer">
                Fuente
              </a>
              <a href={source.socialUrl} target="_blank" rel="noopener noreferrer">
                {source.socialLabel}
              </a>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
