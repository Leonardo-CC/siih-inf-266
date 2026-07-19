// components/Graficas.jsx
// Graficas ligeras en SVG puro (sin dependencias externas).

export function GraficaDona({ datos, titulo, centro = 'Total' }) {
  const total = datos.reduce((acc, d) => acc + (d.valor || 0), 0);
  const radio = 70;
  const grosor = 22;
  const circunferencia = 2 * Math.PI * radio;
  let offset = 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/70 p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">{titulo}</h3>
      {total === 0 ? (
        <p className="text-sm text-slate-400 text-center py-8">Sin datos para mostrar.</p>
      ) : (
        <div className="flex items-center gap-5">
          <div className="relative shrink-0">
            <svg width="160" height="160" viewBox="0 0 160 160" className="-rotate-90">
              <circle cx="80" cy="80" r={radio} fill="none" stroke="#eef2f7" strokeWidth={grosor} />
              {datos.map((d, i) => {
                if (!d.valor) return null;
                const fraccion = d.valor / total;
                const largo = fraccion * circunferencia;
                const segmento = (
                  <circle
                    key={i}
                    cx="80"
                    cy="80"
                    r={radio}
                    fill="none"
                    stroke={d.color}
                    strokeWidth={grosor}
                    strokeDasharray={`${largo} ${circunferencia - largo}`}
                    strokeDashoffset={-offset}
                    strokeLinecap="butt"
                    style={{ transition: 'stroke-dasharray 0.6s ease' }}
                  />
                );
                offset += largo;
                return segmento;
              })}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-slate-800 tabular-nums">{total}</span>
              <span className="text-[11px] text-slate-400">{centro}</span>
            </div>
          </div>
          <ul className="space-y-2 flex-1">
            {datos.map((d, i) => (
              <li key={i} className="flex items-center gap-2 text-sm">
                <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                <span className="text-slate-600 flex-1">{d.label}</span>
                <span className="font-semibold text-slate-800 tabular-nums">{d.valor}</span>
                <span className="text-xs text-slate-400 w-10 text-right">
                  {total ? Math.round((d.valor / total) * 100) : 0}%
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function GraficaBarras({ datos, titulo, color = '#0b5fa5' }) {
  const max = Math.max(1, ...datos.map((d) => d.valor || 0));

  return (
    <div className="bg-white rounded-2xl border border-slate-200/70 p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">{titulo}</h3>
      {datos.length === 0 || datos.every((d) => !d.valor) ? (
        <p className="text-sm text-slate-400 text-center py-8">Sin datos para mostrar.</p>
      ) : (
        <div className="space-y-3">
          {datos.map((d, i) => {
            const pct = Math.round(((d.valor || 0) / max) * 100);
            return (
              <div key={i}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600">{d.label}</span>
                  <span className="font-semibold text-slate-800 tabular-nums">{d.valor}</span>
                </div>
                <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${pct}%`, backgroundColor: color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
