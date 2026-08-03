import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { DecisionCard } from "@/components/decision-card";
import { EnvironmentalIntelligence } from "@/components/environmental-intelligence";
import { EventSelector } from "@/components/event-selector";
import { FamilyStatus } from "@/components/family-status";
import { LiveRefresh } from "@/components/live-refresh";
import { LocalNewsFeed } from "@/components/local-news-feed";
import { MetropolitanStatus } from "@/components/metropolitan-status";
import { OfficialLiveChannels } from "@/components/official-live-channels";
import { PersonalLocationWeather } from "@/components/personal-location-weather";
import { ResourceList } from "@/components/resource-list";
import { RiskMap } from "@/components/risk-map";
import { SituationPanel } from "@/components/situation-panel";
import { getCityStatus } from "@/lib/data/city-status";
import { getDashboardData } from "@/lib/data/dashboard";
import { familyStatuses } from "@/lib/mock-data";
import { getLatestMetropolitanFeed } from "@/lib/news/latest-metropolitan-feed";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [dashboard, localNews, cityStatus] = await Promise.all([
    getDashboardData(),
    getLatestMetropolitanFeed(),
    getCityStatus(),
  ]);
  const { event, resources, hazardZones, roadClosures } = dashboard;
  const incidentCount = localNews.items.length;

  return (
    <main className="app-shell" id="inicio">
      <LiveRefresh />
      <AppHeader dataMode={dashboard.source === "supabase" ? "connected" : "local"} />

      <section
        className={event.isSimulation ? "mode-banner mode-banner-simulation" : "mode-banner mode-banner-live"}
        role="status"
      >
        <div className="mode-banner-main">
          <span className="mode-banner-icon" aria-hidden="true">
            {event.isSimulation ? "D" : "!"}
          </span>
          <div>
            <strong>{event.isSimulation ? "MODO DEMOSTRACIÓN" : "ALERTA ACTIVA"}</strong>
            <span>
              {event.isSimulation
                ? "Alertas y recursos simulados. Clima, atlas territorial y canales oficiales conservan su fuente."
                : event.title}
            </span>
          </div>
        </div>
        <details className="mode-banner-details">
          <summary>Qué es real y qué es simulado</summary>
          <p>
            El escenario principal y los recursos VIGÍA son demostrativos. El clima, presión,
            viento, fase lunar, atlas de inundación, sismicidad y publicaciones oficiales muestran
            su fuente y vigencia.
          </p>
        </details>
        <small>{event.source} · actualizado {event.updatedAt}</small>
      </section>

      <div className="dashboard dashboard-redesign command-dashboard">
        <MetropolitanStatus
          status={cityStatus}
          incidentCount={incidentCount}
          roadClosureCount={roadClosures.length}
          resourceCount={resources.length}
          hazardZoneCount={hazardZones.length}
        />

        <PersonalLocationWeather />

        <section className="command-grid" aria-label="Centro operativo metropolitano">
          <DecisionCard event={event} resources={resources} hazardZones={hazardZones} />
          <div id="mapa-operativo">
            <RiskMap
              resources={resources}
              hazardZones={hazardZones}
              roadClosures={roadClosures}
            />
          </div>
          <SituationPanel
            status={cityStatus}
            incidentCount={incidentCount}
            roadClosureCount={roadClosures.length}
            resourceCount={resources.length}
            hazardZoneCount={hazardZones.length}
            latestIncidents={localNews.items.slice(0, 2)}
          />
        </section>

        <EnvironmentalIntelligence status={cityStatus} />

        <LocalNewsFeed feed={localNews} compact />
        <OfficialLiveChannels />

        <section className="operations-grid" aria-label="Recursos y plan familiar">
          <ResourceList resources={resources} />
          <FamilyStatus members={familyStatuses} />
        </section>

        <EventSelector activeHazard={event.type} isSimulation={event.isSimulation} />

        <section className="preparedness-strip">
          <div>
            <span className="eyebrow">Resiliencia técnica</span>
            <h2>Información útil incluso cuando los servicios fallan</h2>
            <p>
              VIGÍA distingue datos conectados, reportes verificados y escenarios de demostración para no fabricar certezas.
            </p>
          </div>
          <div className="offline-metrics">
            <span><strong>{resources.length}</strong>recursos</span>
            <span><strong>{hazardZones.length}</strong>zonas de riesgo</span>
            <span><strong>{roadClosures.length}</strong>cierres</span>
            <span><strong>{incidentCount}</strong>avisos &lt;72 h</span>
          </div>
          <div className="preparedness-actions">
            <Link className="secondary-button" href="/avisos">Ver avisos</Link>
            <Link className="secondary-button" href="/familia">Configurar familia</Link>
          </div>
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
