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

  return (
    <section className="panel-card family-panel" id="familia">
      <div className="section-heading">
        <div>
          <span className="eyebrow">Plan familiar</span>
          <h2>{isUnconfigured ? "Protege y reúne a tu familia" : "Estado del grupo"}</h2>
          <p className="section-description">
            {isUnconfigured
              ? "Define cómo comunicarse y dónde reunirse antes de necesitarlo."
              : "Confirmaciones compartidas durante las últimas 24 horas."}
          </p>
        </div>
        {!isUnconfigured ? (
          <Link className="text-button" href="/familia">Avisar a todos</Link>
        ) : null}
      </div>

      {isUnconfigured ? (
        <div className="family-onboarding">
          <div className="family-onboarding-icon" aria-hidden="true">◎</div>
          <ul>
            <li>Comparte tu estado con contactos autorizados.</li>
            <li>Define dos puntos de reunión alternativos.</li>
            <li>Registra medicamentos, adultos mayores y mascotas.</li>
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

          <div className="family-list">
            {members.map((member) => (
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
