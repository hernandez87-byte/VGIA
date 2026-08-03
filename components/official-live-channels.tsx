const CHANNELS = [
  {
    id: "pcnl",
    name: "Protección Civil Nuevo León",
    pageUrl: "https://www.facebook.com/proteccioncivilnuevoleon/",
    portalUrl: "https://www.nl.gob.mx/es/proteccion-civil",
  },
  {
    id: "pc-monterrey",
    name: "Protección Civil Monterrey",
    pageUrl: "https://www.facebook.com/761222200588751/",
    portalUrl: "https://www.monterrey.gob.mx/dependencias/protecci%C3%B3n-civil/",
  },
] as const;

function facebookPluginUrl(pageUrl: string): string {
  const params = new URLSearchParams({
    href: pageUrl,
    tabs: "timeline",
    width: "500",
    height: "360",
    small_header: "true",
    adapt_container_width: "true",
    hide_cover: "true",
    show_facepile: "false",
  });
  return `https://www.facebook.com/plugins/page.php?${params.toString()}`;
}

export function OfficialLiveChannels() {
  return (
    <section className="official-live-panel" aria-labelledby="official-live-title">
      <div className="official-live-heading">
        <div>
          <span className="eyebrow">Última hora social</span>
          <h2 id="official-live-title">Canales oficiales en vivo</h2>
          <p>
            Publicaciones recientes servidas directamente por Meta. Pueden solicitar inicio de sesión.
          </p>
        </div>
        <span>Sin notas antiguas de relleno</span>
      </div>

      <div className="official-live-grid">
        {CHANNELS.map((channel) => (
          <article className="official-live-card" key={channel.id}>
            <header>
              <div><i /> <strong>{channel.name}</strong></div>
              <span>Facebook oficial</span>
            </header>
            <iframe
              src={facebookPluginUrl(channel.pageUrl)}
              title={`Últimas publicaciones de ${channel.name}`}
              width="500"
              height="360"
              loading="lazy"
              allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
            />
            <footer>
              <a href={channel.pageUrl} target="_blank" rel="noopener noreferrer">Abrir Facebook</a>
              <a href={channel.portalUrl} target="_blank" rel="noopener noreferrer">Portal oficial</a>
            </footer>
          </article>
        ))}
      </div>
    </section>
  );
}
