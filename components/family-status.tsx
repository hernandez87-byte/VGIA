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
  return (
    <section className="panel-card family-panel">
      <div className="section-heading">
        <div>
          <span className="eyebrow">Plan familiar</span>
          <h2>Estado del grupo</h2>
        </div>
        <button type="button" className="text-button">Avisar a todos</button>
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

      <button type="button" className="wide-secondary-button">Compartir mi estado</button>
    </section>
  );
}
