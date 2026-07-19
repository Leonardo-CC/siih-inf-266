export default function TablaCRUD({
  columnas,
  datos,
  cargando,
  onEditar,
  onEliminar,
  emptyMessage = 'Sin registros',
  iconoEditar,
  iconoEliminar,
  acciones,
  renderAcciones,
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
            {(onEditar || onEliminar || (acciones && acciones.length) || renderAcciones) && (
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
              {(onEditar || onEliminar || (acciones && acciones.length) || renderAcciones) && (
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  {renderAcciones ? renderAcciones(fila) : (
                    <>
                      {acciones && acciones.map((acc, i) => (
                        <button
                          key={i}
                          onClick={() => acc.onClick(fila)}
                          className={`inline-flex items-center justify-center w-8 h-8 rounded-lg transition-colors mr-1 ${acc.className || 'text-slate-600 hover:bg-slate-100'}`}
                          title={acc.title || 'Acción'}
                        >
                          {acc.icono || '•'}
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
  );
}
