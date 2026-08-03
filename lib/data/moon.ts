const SYNODIC_MONTH_DAYS = 29.530588853;
const REFERENCE_NEW_MOON_UTC = Date.UTC(2000, 0, 6, 18, 14, 0);
const DAY_MS = 86_400_000;

export interface MoonStatus {
  phase: string;
  icon: string;
  ageDays: number;
  illuminationPercent: number;
  nextFullMoon: string;
  nextNewMoon: string;
}

function normalizedMoonAge(date: Date): number {
  const elapsedDays = (date.getTime() - REFERENCE_NEW_MOON_UTC) / DAY_MS;
  return ((elapsedDays % SYNODIC_MONTH_DAYS) + SYNODIC_MONTH_DAYS) % SYNODIC_MONTH_DAYS;
}

function phaseName(ageDays: number): { phase: string; icon: string } {
  const normalized = ageDays / SYNODIC_MONTH_DAYS;
  if (normalized < 0.0625 || normalized >= 0.9375) return { phase: "Luna nueva", icon: "●" };
  if (normalized < 0.1875) return { phase: "Creciente", icon: "◔" };
  if (normalized < 0.3125) return { phase: "Cuarto creciente", icon: "◐" };
  if (normalized < 0.4375) return { phase: "Gibosa creciente", icon: "◕" };
  if (normalized < 0.5625) return { phase: "Luna llena", icon: "○" };
  if (normalized < 0.6875) return { phase: "Gibosa menguante", icon: "◕" };
  if (normalized < 0.8125) return { phase: "Cuarto menguante", icon: "◑" };
  return { phase: "Menguante", icon: "◔" };
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("es-MX", {
    timeZone: "America/Monterrey",
    day: "2-digit",
    month: "short",
  }).format(date);
}

function nextTargetDate(date: Date, ageDays: number, targetAge: number): Date {
  let daysUntil = targetAge - ageDays;
  if (daysUntil <= 0) daysUntil += SYNODIC_MONTH_DAYS;
  return new Date(date.getTime() + daysUntil * DAY_MS);
}

export function getMoonStatus(date = new Date()): MoonStatus {
  const ageDays = normalizedMoonAge(date);
  const angle = (ageDays / SYNODIC_MONTH_DAYS) * Math.PI * 2;
  const illuminationPercent = ((1 - Math.cos(angle)) / 2) * 100;
  const phase = phaseName(ageDays);

  return {
    phase: phase.phase,
    icon: phase.icon,
    ageDays: Number(ageDays.toFixed(1)),
    illuminationPercent: Math.round(illuminationPercent),
    nextFullMoon: formatDate(nextTargetDate(date, ageDays, SYNODIC_MONTH_DAYS / 2)),
    nextNewMoon: formatDate(nextTargetDate(date, ageDays, SYNODIC_MONTH_DAYS)),
  };
}
