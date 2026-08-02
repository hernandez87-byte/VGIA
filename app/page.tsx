import { BrandMark } from "@/components/brand-mark";
import { DecisionCard } from "@/components/decision-card";
import { EventSelector } from "@/components/event-selector";
import { FamilyStatus } from "@/components/family-status";
import { LiveDataPanel } from "@/components/live-data-panel";
import { ResourceList } from "@/components/resource-list";
import { RiskMap } from "@/components/risk-map";
import { getLiveSnapshot } from "@/lib/data-sources/live-snapshot";
import { activeEvent, familyStatuses, resources } from "@/lib/mock-data";

export const dynamic = "force-dynamic";

export default async function Home() {
  const liveSnapshot = await getLiveSnapshot();
  const onlineSources = liveSnapshot.sources.filter(
    (source) => source.status === "online",
  ).length;

  return (
    <main className="app-shell">
      <header className="topbar">
        <BrandMark />
        <div className="topbar-center">
          <span className="live-pulse" />
          <span>Monterrey · {onlineSources}/{liveSnapshot.sources.length} fuentes conectadas</span>
        </div>
        <nav className="topbar-actions" aria-label="Acciones principales">
          <button type="button" className="topbar-button">Sin conexión: listo</button>
          <button type="button" className="profile-button" aria-label="Perfil de usuario">EH</button>
        </nav>
      </header>

      <div className="emergency-banner" role="status">
        <span className="banner-icon" aria-hidden="true">!</span>
        <p><strong>Escenario demostrativo:</strong> {activeEvent.title}</p>
        <span>La sección “Actividad observada” ya consume fuentes externas reales</span>
      </div>

      <div className="dashboard">
        <section className="hero-grid">
          <DecisionCard event={activeEvent} />
          <RiskMap />
        </section>

        <EventSelector />
        <LiveDataPanel snapshot={liveSnapshot} />

        <section className="operations-grid">
          <ResourceList resources={resources} />
          <FamilyStatus members={familyStatuses} />
        </section>

        <section className="preparedness-strip">
          <div>
            <span className="eyebrow">Antes de que falle la ciudad</span>
            <h2>Tu paquete sin conexión está actualizado</h2>
            <p>Incluye mapas, refugios, rutas, contactos y protocolos de Monterrey.</p>
          </div>
          <div className="offline-metrics">
            <span><strong>42 MB</strong> descargados</span>
            <span><strong>7</strong> escenarios</span>
            <span><strong>Hoy</strong> última actualización</span>
          </div>
          <button type="button" className="secondary-button">Administrar descarga</button>
        </section>
      </div>

      <footer className="footer-note">
        Los datos reales se muestran con su fuente y nivel de verificación. El escenario principal continúa siendo demostrativo y no sustituye instrucciones oficiales.
      </footer>
    </main>
  );
}
