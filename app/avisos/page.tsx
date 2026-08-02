import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { LocalNewsFeed } from "@/components/local-news-feed";
import { getVerifiedOfficialFeed } from "@/lib/news/verified-official-feed";

export const dynamic = "force-dynamic";

export default async function AlertsPage() {
  const feed = await getVerifiedOfficialFeed();

  return (
    <main className="app-shell alerts-page">
      <AppHeader dataMode="connected" />

      <div className="alerts-page-shell">
        <div className="page-intro">
          <div>
            <span className="eyebrow">Información operativa verificada</span>
            <h1>Avisos oficiales metropolitanos</h1>
            <p>
              Publicaciones recientes de Protección Civil y cuentas institucionales.
              La página separa información pública de las alertas operativas que requieren
              una acción inmediata.
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
