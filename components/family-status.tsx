import Link from "next/link";
import type { FamilyMemberStatus } from "@/lib/domain/emergency";

interface FamilyStatusProps {
  members: FamilyMemberStatus[];
}

const statusLabel: Record<FamilyMemberStatus["status"], string> = {
  safe: "A salvo",
  moving: "En movimiento",
  "needs-help": "Necesita ayuda",
  unknown: "Sin confirmar",
};

export function FamilyStatus({ members }: FamilyStatusProps) {
  const isUnconfigured =
    members.length === 0 ||
    (members.length === 1 && members[0]?.name === "Usuario" && members[0]?.status === "unknown");

  const safeCount = members.filter((member) => member.status === "safe").length;
  const movingCount = members.filter((member) => member.status === "moving").length;
  const helpCount = members.filter((member) => member.status === "needs-help").length;
  const unknownCount = members.filter((member) => member.status === "unknown").length;
  const total = isUnconfigured ? 3 : members.length;
  const progress = total > 0 ? Math.round((safeCount / total) * 100) : 0;

  return (
    <section className="panel-card family-panel family-panel-command" id="familia">
      <div className="section-heading">
        <div>
          <span className="eyebrow">Plan familiar</span>
          <h2>{isUnconfigured ? "Tu red de seguridad" : "Estado del grupo"}</h2>
          <p className="section-description">
            {isUnconfigured
              ? "Configura contactos, puntos de reunión y necesidades médicas antes de una emergencia."
              : "Confirmaciones compartidas durante las últimas 24 horas."}
          </p>
        </div>
        {!isUnconfigured ? (
          <Link className="text-button" href="/familia">Avisar a todos</Link>
        ) : null}
      </div>

      <div className="family-readiness">
        <div
          className="family-progress-ring"
          style={{ "--family-progress": `${progress * 3.6}deg` } as React.CSSProperties}
          aria-label={`${safeCount} de ${total} personas a salvo`}
        >
          <span><strong>{safeCount}/{total}</strong>A salvo</span>
        </div>
        <div className="family-readiness-copy">
          <strong>{isUnconfigured ? "Plan todavía sin configurar" : "Seguimiento activo"}</strong>
          <span>
            {isUnconfigured
              ? "La aplicación todavía no sabe a quién localizar ni qué necesidades médicas considerar."
              : `${unknownCount} sin confirmar · ${helpCount} necesitan ayuda · ${movingCount} en traslado.`}
          </span>
        </div>
      </div>

      {isUnconfigured ? (
        <div className="family-onboarding family-onboarding-compact">
          <div className="family-readiness-grid">
            <span><i>2</i>Puntos de reunión</span>
            <span><i>Rx</i>Medicamentos</span>
            <span><i>♥</i>Adultos mayores</span>
            <span><i>●</i>Mascotas</span>
          </div>
          <ul>
            <li>Comparte tu estado solo con contactos autorizados.</li>
            <li>Define una alternativa fuera de tu colonia.</li>
            <li>Registra medicamentos y movilidad limitada.</li>
          </ul>
          <Link className="primary-button family-primary-action" href="/familia">
            Configurar mi familia
          </Link>
        </div>
      ) : (
        <>
          <div className="family-summary" aria-label="Resumen del grupo familiar">
            <span className="family-summary-safe"><strong>{safeCount}</strong>A salvo</span>
            <span className="family-summary-moving"><strong>{movingCount}</strong>En movimiento</span>
            <span className="family-summary-help"><strong>{helpCount}</strong>Necesitan ayuda</span>
            <span className="family-summary-unknown"><strong>{unknownCount}</strong>Sin confirmar</span>
          </div>

          <div className="family-list family-list-compact">
            {members.slice(0, 4).map((member) => (
              <article className="family-item" key={member.id}>
                <span className="avatar" aria-hidden="true">{member.name.slice(0, 1)}</span>
                <div>
                  <strong>{member.name}</strong>
                  <span>{member.locationLabel}</span>
                </div>
                <div className={`family-state family-${member.status}`}>
                  <i />
                  <span>{statusLabel[member.status]}</span>
                  <small>{member.updatedMinutesAgo} min</small>
                </div>
              </article>
            ))}
          </div>

          <Link className="wide-secondary-button family-share-action" href="/familia">
            Compartir mi estado
          </Link>
        </>
      )}
    </section>
  );
}
