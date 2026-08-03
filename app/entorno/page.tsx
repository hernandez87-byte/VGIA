import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { EnvironmentalIntelligence } from "@/components/environmental-intelligence";
import { MetropolitanStatus } from "@/components/metropolitan-status";
import { PersonalLocationWeather } from "@/components/personal-location-weather";
import { RiskMap } from "@/components/risk-map";
import { getCityStatus } from "@/lib/data/city-status";
import { getDashboardData } from "@/lib/data/dashboard";

export const dynamic = "force-dynamic";

export default async function EnvironmentPage() {
  const [status, dashboard] = await Promise.all([
    getCityStatus(),
    getDashboardData(),
  ]);

  return (
    <main className="app-shell environment-page">
      <AppHeader dataMode={dashboard.source === "supabase" ? "connected" : "local"} />

      <div className="environment-page-shell">
        <div className="page-intro environment-page-intro">
          <div>
            <span className="eyebrow">Inteligencia ambiental y territorial</span>
            <h1>Entorno de Monterrey</h1>
            <p>
              Pronóstico, presión, viento, fase lunar, calidad del aire, corrientes,
              inundación frecuente y sismicidad histórica en una sola vista técnica.
            </p>
          </div>
          <Link className="secondary-button" href="/">
            Volver al centro operativo
          </Link>
        </div>

        <MetropolitanStatus
          status={status}
          incidentCount={0}
          roadClosureCount={dashboard.roadClosures.length}
          resourceCount={dashboard.resources.length}
          hazardZoneCount={dashboard.hazardZones.length}
        />

        <PersonalLocationWeather />
        <EnvironmentalIntelligence status={status} />

        <section className="environment-map-section" aria-labelledby="environment-map-title">
          <div className="environment-map-heading">
            <div>
              <span className="eyebrow">Atlas multicapas</span>
              <h2 id="environment-map-title">Clima, agua, inundación y sismicidad</h2>
              <p>
                Activa únicamente las capas que necesites. Temperatura, presión y viento son modos exclusivos para conservar legibilidad.
              </p>
            </div>
          </div>
          <RiskMap
            resources={dashboard.resources}
            hazardZones={dashboard.hazardZones}
            roadClosures={dashboard.roadClosures}
          />
        </section>

        <section className="environment-source-note">
          <strong>Cómo interpretar los datos</strong>
          <p>
            Las condiciones meteorológicas son modelos para coordenadas concretas. La red hidrográfica no mide caudal en vivo, la inundación TR2 representa modelación territorial y la sismicidad muestra actividad histórica, no una predicción.
          </p>
        </section>
      </div>
    </main>
  );
}
