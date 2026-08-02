import styles from "@/components/live-data-panel.module.css";
import type { LiveSnapshot } from "@/lib/data-sources/types";

const severityLabel = {
  low: "Baja",
  moderate: "Moderada",
  high: "Alta",
  critical: "Crítica",
  unknown: "Sin evaluar",
} as const;

const sourceKindLabel = {
  official: "Oficial",
  scientific: "Científica",
  community: "Comunitaria",
} as const;

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Monterrey",
  }).format(new Date(value));
}

export function LiveDataPanel({ snapshot }: { snapshot: LiveSnapshot }) {
  return (
    <section className={`panel-card ${styles.panel}`}>
      <div className="section-heading">
        <div>
          <span className="eyebrow">Conexiones reales</span>
          <h2>Actividad observada</h2>
        </div>
        <span className="freshness">Actualizado {formatDate(snapshot.generatedAt)}</span>
      </div>

      <div className={styles.sourceGrid}>
        {snapshot.sources.map((source) => (
          <article className={styles.sourceCard} key={source.id}>
            <div className="resource-title-row">
              <strong>{source.label}</strong>
              <span className={`status-chip ${source.status === "online" ? "status-success" : "status-warning"}`}>
                {source.status === "online" ? "En línea" : "Degradada"}
              </span>
            </div>
            <p>{source.itemCount} registros · {sourceKindLabel[source.sourceKind]}</p>
            {source.message ? <small>{source.message}</small> : null}
          </article>
        ))}
      </div>

      <div className={styles.columns}>
        <div>
          <h3>Eventos recientes</h3>
          <div className={styles.feedList}>
            {snapshot.hazards.slice(0, 6).map((hazard) => (
              <article className={styles.feedItem} key={hazard.id}>
                <div className="resource-title-row">
                  <strong>{hazard.title}</strong>
                  <span className="status-chip status-neutral">
                    {severityLabel[hazard.severity]}
                  </span>
                </div>
                <p>{hazard.summary}</p>
                <small>{hazard.source} · {formatDate(hazard.updatedAt)}</small>
              </article>
            ))}
            {snapshot.hazards.length === 0 ? (
              <p className={styles.emptyState}>Ninguna fuente de eventos respondió.</p>
            ) : null}
          </div>
        </div>

        <div>
          <h3>Recursos cartografiados en Monterrey</h3>
          <div className={styles.feedList}>
            {snapshot.resources.slice(0, 6).map((resource) => (
              <article className={styles.feedItem} key={resource.id}>
                <div className="resource-title-row">
                  <strong>{resource.name}</strong>
                  <span className="status-chip status-warning">Sin verificar</span>
                </div>
                <p>{resource.category} · {resource.details}</p>
                <small>
                  {resource.source} · {resource.coordinates.latitude.toFixed(4)}, {resource.coordinates.longitude.toFixed(4)}
                </small>
              </article>
            ))}
            {snapshot.resources.length === 0 ? (
              <p className={styles.emptyState}>La fuente comunitaria de recursos no respondió.</p>
            ) : null}
          </div>
        </div>
      </div>

      <p className={styles.disclaimer}>
        Los eventos provienen de fuentes oficiales o científicas. Los recursos de OpenStreetMap son ubicaciones comunitarias y no confirman apertura, inventario, acceso ni seguridad.
      </p>
    </section>
  );
}
