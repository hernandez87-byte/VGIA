"use client";

import { useMemo, useState } from "react";
import type { LocalNewsFeed, NewsMediaType } from "@/lib/news/local-news";

type NewsFilter = "all" | "emergency" | NewsMediaType;

interface LocalNewsFeedProps {
  feed: LocalNewsFeed;
}

const FILTERS: Array<{ id: NewsFilter; label: string }> = [
  { id: "all", label: "Todo" },
  { id: "emergency", label: "Emergencias" },
  { id: "video", label: "Videos" },
  { id: "facebook", label: "Facebook" },
];

function mediaLabel(mediaType: NewsMediaType): string {
  if (mediaType === "video") return "Video";
  if (mediaType === "facebook") return "Facebook";
  return "Nota";
}

export function LocalNewsFeed({ feed }: LocalNewsFeedProps) {
  const [filter, setFilter] = useState<NewsFilter>("all");

  const visibleItems = useMemo(() => {
    if (filter === "all") return feed.items;
    if (filter === "emergency") {
      return feed.items.filter((item) => item.isEmergencyRelated);
    }
    return feed.items.filter((item) => item.mediaType === filter);
  }, [feed.items, filter]);

  return (
    <section className="news-panel" aria-labelledby="metropolitan-news-title">
      <div className="news-panel-header">
        <div>
          <span className="eyebrow">Información metropolitana</span>
          <h2 id="metropolitan-news-title">Últimas noticias de la zona metropolitana</h2>
          <p>
            Medios locales verificados, canales oficiales y publicaciones públicas.
            Una noticia no equivale a una instrucción de emergencia.
          </p>
        </div>
        <div className="news-feed-status">
          <span className={`news-mode news-mode-${feed.mode}`}>
            {feed.mode === "live"
              ? "Fuentes conectadas"
              : feed.mode === "partial"
                ? "Conexión parcial"
                : "Fuentes no disponibles"}
          </span>
          <small>Actualizado {feed.updatedAt}</small>
        </div>
      </div>

      <div className="news-filters" role="group" aria-label="Filtrar noticias">
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
                aria-label={`Abrir noticia: ${item.title}`}
              >
                {item.imageUrl ? (
                  // Fuentes remotas variables; se evita next/image para no ampliar dominios a ciegas.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.imageUrl} alt="" loading="lazy" referrerPolicy="no-referrer" />
                ) : (
                  <span className="news-card-placeholder" aria-hidden="true">
                    {item.mediaType === "video" ? "▶" : item.mediaType === "facebook" ? "f" : "V"}
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
                    href={item.sourceFacebookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Abrir Facebook oficial de ${item.sourceName}`}
                  >
                    Facebook oficial
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="news-empty-state">
          <strong>No hay elementos para este filtro.</strong>
          <span>Las fuentes pueden no haber publicado ese formato recientemente.</span>
        </div>
      )}

      <div className="news-sources" aria-label="Fuentes informativas conectadas">
        {feed.sources.map((source) => (
          <div key={source.id} className="news-source">
            <span className={source.available ? "source-dot is-online" : "source-dot"} />
            <div>
              <strong>{source.name}</strong>
              <small>
                {source.trust === "government" ? "Fuente gubernamental" : "Medio local verificado"}
                {source.itemCount > 0 ? ` · ${source.itemCount} elementos` : " · sin respuesta"}
              </small>
            </div>
            <div className="news-source-links">
              <a href={source.siteUrl} target="_blank" rel="noopener noreferrer">Sitio</a>
              <a href={source.facebookUrl} target="_blank" rel="noopener noreferrer">Facebook</a>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
