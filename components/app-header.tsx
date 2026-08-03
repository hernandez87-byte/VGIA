import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";

interface AppHeaderProps {
  dataMode?: "connected" | "local";
}

export function AppHeader({ dataMode = "connected" }: AppHeaderProps) {
  return (
    <header className="app-header">
      <div className="app-header-inner">
        <Link className="brand-home" href="/" aria-label="Ir al inicio de VIGÍA">
          <BrandMark />
        </Link>

        <nav className="primary-navigation" aria-label="Navegación principal">
          <Link href="/">Inicio</Link>
          <Link href="/#mapa-operativo">Mapa</Link>
          <Link href="/avisos">Avisos</Link>
          <Link href="/#recursos">Recursos</Link>
          <Link href="/entorno">Entorno</Link>
          <Link href="/familia">Familia</Link>
        </nav>

        <div className="app-header-actions">
          <span className="location-indicator">
            <i aria-hidden="true" />
            Monterrey
            <small>{dataMode === "connected" ? "Datos conectados" : "Modo local"}</small>
          </span>
          <Link className="header-report-button" href="/reportar">
            Reportar incidente
          </Link>
          <Link className="profile-button profile-link" href="/login" aria-label="Iniciar sesión">
            EH
          </Link>
        </div>
      </div>
    </header>
  );
}
