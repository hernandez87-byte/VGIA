export function RiskMap() {
  return (
    <section className="map-card" aria-label="Mapa demostrativo de ruta segura">
      <div className="map-toolbar">
        <div>
          <span className="eyebrow">Ruta recomendada</span>
          <strong>1.7 km · 18 minutos a pie</strong>
        </div>
        <button type="button" className="icon-button" aria-label="Centrar mapa">⌖</button>
      </div>

      <div className="mock-map">
        <div className="map-grid-lines" />
        <div className="danger-zone danger-zone-one" />
        <div className="danger-zone danger-zone-two" />
        <svg className="route-line" viewBox="0 0 700 380" role="img" aria-label="Ruta que evita dos zonas inundadas">
          <path d="M96 292 C160 262 170 202 252 210 C346 220 326 124 430 132 C505 138 540 87 618 76" fill="none" stroke="rgba(8,19,31,.85)" strokeWidth="14" strokeLinecap="round" />
          <path d="M96 292 C160 262 170 202 252 210 C346 220 326 124 430 132 C505 138 540 87 618 76" fill="none" stroke="#17C3A2" strokeWidth="7" strokeLinecap="round" strokeDasharray="2 13" />
        </svg>
        <div className="map-marker user-marker" aria-label="Tu ubicación"><span>●</span></div>
        <div className="map-marker shelter-marker" aria-label="Refugio"><span>V</span></div>
        <div className="road-closed road-one"><strong>×</strong><span>Paso cerrado</span></div>
        <div className="road-closed road-two"><strong>×</strong><span>Arroyo</span></div>
        <div className="map-legend">
          <span><i className="legend-route" /> Ruta segura</span>
          <span><i className="legend-risk" /> Inundación</span>
        </div>
      </div>

      <div className="map-footer">
        <div>
          <span className="route-step-index">1</span>
          <p><strong>Sal por Calle Norte.</strong> Evita Avenida Lincoln y el paso deprimido.</p>
        </div>
        <span className="confidence">Confianza alta</span>
      </div>
    </section>
  );
}
