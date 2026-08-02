import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { DecisionCard } from "@/components/decision-card";
import { EventSelector } from "@/components/event-selector";
import { FamilyStatus } from "@/components/family-status";
import { LiveRefresh } from "@/components/live-refresh";
import { ResourceList } from "@/components/resource-list";
import { RiskMap } from "@/components/risk-map";
import { getDashboardData } from "@/lib/data/dashboard";
import { familyStatuses } from "@/lib/mock-data";

export const dynamic = "force-dynamic";

export default async function Home() {
  const dashboard = await getDashboardData();
  const { event, resources, hazardZones, roadClosures } = dashboard;

  return (
    <main className="app-shell">
      <LiveRefresh />

      <header className="topbar">
        <BrandMark />
        <div className="topbar-center">
          <span className="live-pulse" />
          <span>
            Monterrey · {dashboard.source === "supabase" ? "datos conectados" : "modo local"}
          </span>
        </div>
        <nav className="topbar-actions" aria-label="Acciones principales">
          <Link className="topbar-button" href="/reportar">Reportar</Link>
          <Link className="topbar-button" href="/familia">Mi familia</Link>
          <Link className="profile-button profile-link" href="/login" aria-label="Iniciar sesión">
            EH
          </Link>
        </nav>
      </header>

      <div
        className={event.isSimulation ? "emergency-banner simulation-banner" : "emergency-banner"}
        role="status"
      >
        <span className="banner-icon" aria-hidden="true">
          {event.isSimulation ? "S" : "!"}
        </span>
        <p>
          <strong>{event.isSimulation ? "Simulación activa:" : "Alerta activa:"}</strong>{" "}
          {event.title}
        </p>
        <span>
          {event.source} · actualización {event.updatedAt}
        </span>
      </div>

      <div className="dashboard">
        <section className="hero-grid">
          <DecisionCard event={event} />
          <div id="mapa-operativo">
            <RiskMap
              resources={resources}
              hazardZones={hazardZones}
              roadClosures={roadClosures}
            />
          </div>
        </section>

        <EventSelector />

        <section className="operations-grid">
          <ResourceList resources={resources} />
          <FamilyStatus members={familyStatuses} />
        </section>

        <section className="preparedness-strip">
          <div>
            <span className="eyebrow">Resiliencia técnica</span>
            <h2>La aplicación puede degradarse sin inventar datos</h2>
            <p>
              El mapa y las alertas usan Supabase cuando está disponible; el fallback local siempre aparece como simulación no verificada.
            </p>
          </div>
          <div className="offline-metrics">
            <span>
              <strong>{resources.length}</strong> recursos
            </span>
            <span>
              <strong>{hazardZones.length}</strong> zonas
            </span>
            <span>
              <strong>{roadClosures.length}</strong> cierres
            </span>
          </div>
          <Link className="secondary-button link-button" href="/familia">
            Configurar familia
          </Link>
        </section>
      </div>

      <footer className="footer-note">
        {event.isSimulation
          ? "Simulación demostrativa. No la uses para tomar decisiones reales de emergencia."
          : "VIGÍA complementa, pero no sustituye, las instrucciones de las autoridades."}
      </footer>
    </main>
  );
}
