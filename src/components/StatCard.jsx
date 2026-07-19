import { Link } from 'react-router-dom';

export default function StatCard({ titulo, valor, icono, color = 'bg-primary', link, retraso = 0 }) {
  const contenido = (
    <div
      style={{ animationDelay: `${retraso}ms` }}
      className="stat-card group bg-white rounded-2xl border border-slate-200/70 p-5 flex items-center gap-4 hover:shadow-xl hover:-translate-y-1 hover:border-primary/40 transition-all duration-300"
    >
      <div className={`${color} text-white rounded-2xl p-3.5 text-2xl shadow-md shadow-primary/20 group-hover:scale-110 transition-transform duration-300`}>
        {icono}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-500 truncate">{titulo}</p>
        <p className="text-3xl font-bold text-slate-800 mt-0.5 tabular-nums">{valor}</p>
      </div>
    </div>
  );

  if (link) {
    return (
      <Link to={link} className="block h-full">
        {contenido}
      </Link>
    );
  }

  return contenido;
}
