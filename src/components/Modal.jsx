import { useEffect, useRef } from 'react';

export default function Modal({ abierto, alCerrar, titulo, children, ancho = 'max-w-lg' }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (abierto && !dialog.open) {
      dialog.showModal();
    } else if (!abierto && dialog.open) {
      dialog.close();
    }
  }, [abierto]);

  return (
    <dialog
      ref={dialogRef}
      className={`${ancho} w-full rounded-xl shadow-2xl p-0 backdrop:bg-black/50 open:animate-in`}
      onClose={alCerrar}
    >
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
        <h3 className="text-lg font-semibold text-slate-800">{titulo}</h3>
        <button
          onClick={alCerrar}
          className="text-slate-400 hover:text-slate-600 transition-colors text-xl leading-none"
        >
          ×
        </button>
      </div>
      <div className="px-6 py-5">
        {children}
      </div>
    </dialog>
  );
}