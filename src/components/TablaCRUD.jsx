export default function TablaCRUD({
  columnas,
  datos,
  cargando,
  onEditar,
  onEliminar,
  renderAcciones,
  emptyMessage = 'Sin registros',
}) {
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

  const tieneAcciones = Boolean(onEditar || onEliminar || renderAcciones);

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200">
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
          {datos.map((fila, idx) => (
            <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50/60 transition-colors">
              {columnas.map((col) => (
                <td key={col.clave} className="px-4 py-3 text-slate-700">
                  {col.render ? col.render(fila[col.clave], fila) : fila[col.clave] ?? '-'}
                </td>
              ))}
              {tieneAcciones && (
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  {onEditar && (
                    <button
                      onClick={() => onEditar(fila)}
                      className="text-primary hover:text-primary-dark font-medium mr-3"
                    >
                      Editar
                    </button>
                  )}
                  {renderAcciones && renderAcciones(fila)}
                  {onEliminar && (
                    <button
                      onClick={() => onEliminar(fila)}
                      className="text-red-600 hover:text-red-700 font-medium"
                    >
                      Eliminar
                    </button>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
