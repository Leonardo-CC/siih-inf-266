import { Link } from 'react-router-dom';

export default function StatCard({ titulo, valor, icono, color = 'bg-primary', link }) {
  const contenido = (
    <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-center gap-4 hover:shadow-lg transition-shadow duration-200">
      <div className={`${color} text-white rounded-xl p-3.5 text-2xl shadow-md`}>
        {icono}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-500 truncate">{titulo}</p>
        <p className="text-2xl font-bold text-slate-800 mt-0.5">{valor}</p>
      </div>
    </div>
  );

  if (link) {
    return (
      <Link to={link} className="block">
        {contenido}
      </Link>
    );
  }

  return contenido;
}
