import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { LocalNewsFeed } from "@/components/local-news-feed";
import { getLatestMetropolitanFeed } from "@/lib/news/latest-metropolitan-feed";

export const dynamic = "force-dynamic";

export default async function AlertsPage() {
  const feed = await getLatestMetropolitanFeed();

  return (
    <main className="app-shell alerts-page">
      <AppHeader dataMode="connected" />

      <div className="alerts-page-shell">
        <div className="page-intro">
          <div>
            <span className="eyebrow">Información operativa verificada</span>
            <h1>Avisos oficiales de las últimas 72 horas</h1>
            <p>
              Solo se muestran publicaciones con fecha verificable dentro de los últimos tres días.
              Los canales oficiales de Facebook permanecen disponibles para consultar contenido en vivo.
            </p>
          </div>
          <Link className="secondary-button" href="/">
            Volver al tablero
          </Link>
        </div>

        <LocalNewsFeed feed={feed} />
      </div>
    </main>
  );
}
