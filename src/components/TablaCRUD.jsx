import { useEffect, useMemo, useState } from 'react';

export default function TablaCRUD({
  columnas,
  datos,
  cargando,
  onEditar,
  onEliminar,
  renderAcciones,
  emptyMessage = 'Sin registros',
  iconoEditar,
  iconoEliminar,
  acciones,
  pageSize = 10,
}) {
  const [paginaActual, setPaginaActual] = useState(1);

  const totalRegistros = datos?.length || 0;
  const totalPaginas = Math.max(1, Math.ceil(totalRegistros / pageSize));
  const tieneAcciones = Boolean(onEditar || onEliminar || (acciones && acciones.length) || renderAcciones);

  useEffect(() => {
    setPaginaActual(1);
  }, [datos]);

  useEffect(() => {
    if (paginaActual > totalPaginas) setPaginaActual(totalPaginas);
  }, [paginaActual, totalPaginas]);

  const datosPaginados = useMemo(() => {
    if (!datos) return [];
    const inicio = (paginaActual - 1) * pageSize;
    return datos.slice(inicio, inicio + pageSize);
  }, [datos, paginaActual, pageSize]);

  const paginas = useMemo(
    () => Array.from({ length: totalPaginas }, (_, index) => index + 1),
    [totalPaginas]
  );

  if (cargando) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!datos || datos.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-slate-50">
              {columnas.map((col) => (
                <th
                  key={col.clave}
                  className="text-left px-4 py-3 font-semibold text-slate-600 border-b border-slate-200"
                >
                  {col.titulo}
                </th>
              ))}
              {tieneAcciones && (
                <th className="text-right px-4 py-3 font-semibold text-slate-600 border-b border-slate-200">
                  Acciones
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {datosPaginados.map((fila, idx) => (
              <tr
                key={(paginaActual - 1) * pageSize + idx}
                className="border-b border-slate-100 hover:bg-slate-50/60 transition-colors"
              >
                {columnas.map((col) => (
                  <td key={col.clave} className="px-4 py-3 text-slate-700">
                    {col.render ? col.render(fila[col.clave], fila) : fila[col.clave] ?? '-'}
                  </td>
                ))}
                {tieneAcciones && (
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    {renderAcciones ? renderAcciones(fila) : (
                      <>
                        {acciones && acciones.map((acc, i) => (
                          <button
                            key={i}
                            onClick={() => acc.onClick(fila)}
                            className={`inline-flex items-center justify-center w-8 h-8 rounded-lg transition-colors mr-1 ${acc.className || 'text-slate-600 hover:bg-slate-100'}`}
                            title={acc.title || 'Accion'}
                          >
                            {acc.icono || '...'}
                          </button>
                        ))}
                        {onEditar && (
                          <button
                            onClick={() => onEditar(fila)}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors mr-1"
                            title="Editar"
                          >
                            {iconoEditar || 'Editar'}
                          </button>
                        )}
                        {onEliminar && (
                          <button
                            onClick={() => onEliminar(fila)}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-red-600 hover:bg-red-50 transition-colors ml-1"
                            title="Eliminar"
                          >
                            {iconoEliminar || 'Eliminar'}
                          </button>
                        )}
                      </>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPaginas > 1 && (
        <div className="flex flex-col gap-3 border-t border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500">
            Mostrando {(paginaActual - 1) * pageSize + 1}-{Math.min(paginaActual * pageSize, totalRegistros)} de {totalRegistros}
          </p>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setPaginaActual((prev) => Math.max(1, prev - 1))}
              disabled={paginaActual === 1}
              className="px-3 py-1.5 rounded-lg border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Anterior
            </button>

            {paginas.map((pagina) => (
              <button
                key={pagina}
                type="button"
                onClick={() => setPaginaActual(pagina)}
                className={`min-w-9 px-3 py-1.5 rounded-lg border text-sm font-medium transition ${
                  paginaActual === pagina
                    ? 'border-primary bg-primary text-white'
                    : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {pagina}
              </button>
            ))}

            <button
              type="button"
              onClick={() => setPaginaActual((prev) => Math.min(totalPaginas, prev + 1))}
              disabled={paginaActual === totalPaginas}
              className="px-3 py-1.5 rounded-lg border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
