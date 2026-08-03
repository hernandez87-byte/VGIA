import Link from "next/link";
import type { CityStatus } from "@/lib/data/city-status";

interface SituationPanelProps {
  status: CityStatus;
  incidentCount: number;
  roadClosureCount: number;
  resourceCount: number;
  hazardZoneCount: number;
}

function lineState(value: number, singular: string, plural: string): string {
  return `${value} ${value === 1 ? singular : plural}`;
}

export function SituationPanel({
  status,
  incidentCount,
  roadClosureCount,
  resourceCount,
  hazardZoneCount,
}: SituationPanelProps) {
  return (
    <aside className="situation-panel" aria-labelledby="situation-title">
      <div className="situation-heading">
        <div>
          <span className="eyebrow">Resumen operativo</span>
          <h2 id="situation-title">Ahora en Monterrey</h2>
        </div>
        <span className="situation-pulse" aria-label="Actualización activa" />
      </div>

      <div className="situation-weather">
        <span aria-hidden="true">{status.weatherIcon}</span>
        <div>
          <strong>
            {status.temperatureC === null ? "Sin lectura" : `${Math.round(status.temperatureC)} °C`}
          </strong>
          <small>
            Sensación {status.apparentTemperatureC === null
              ? "—"
              : `${Math.round(status.apparentTemperatureC)} °C`}
          </small>
        </div>
      </div>

      <ul className="situation-list">
        <li>
          <span>Incidentes recientes</span>
          <strong className={incidentCount > 0 ? "situation-warn" : "situation-ok"}>
            {lineState(incidentCount, "aviso", "avisos")}
          </strong>
        </li>
        <li>
          <span>Cierres viales</span>
          <strong className={roadClosureCount > 0 ? "situation-warn" : "situation-ok"}>
            {roadClosureCount}
          </strong>
        </li>
        <li>
          <span>Zonas de riesgo</span>
          <strong className={hazardZoneCount > 0 ? "situation-danger" : "situation-ok"}>
            {hazardZoneCount}
          </strong>
        </li>
        <li>
          <span>Recursos visibles</span>
          <strong>{resourceCount}</strong>
        </li>
        <li>
          <span>Calidad del aire</span>
          <strong>{status.airQualityLabel}</strong>
        </li>
        <li>
          <span>Probabilidad de lluvia</span>
          <strong>{status.rainProbability === null ? "—" : `${Math.round(status.rainProbability)} %`}</strong>
        </li>
      </ul>

      <div className="situation-actions">
        <Link href="/avisos">Ver incidentes</Link>
        <Link href="/reportar">Reportar</Link>
      </div>

      <p className="situation-note">
        El clima y el aire son datos modelados. Las órdenes de evacuación solo pueden provenir de autoridades competentes.
      </p>
    </aside>
  );
}
