// api/catalogo/index.js
// ============================================================
// Endpoint unificado de catálogo para el rol administrativo.
//   GET    /api/catalogo?entidad=especialidad|medico|enfermero|farmaceutico|tecnico|tipo_seguro
//   POST   /api/catalogo?entidad=...        -> crear
//   PUT    /api/catalogo?entidad=...&id=... -> actualizar
//   DELETE /api/catalogo?entidad=...&id=... -> eliminar
// ============================================================
import * as svc from '../../services/catalogoService.js';

const HANDLERS = {
  especialidad: {
    list: svc.obtenerEspecialidades,
    create: svc.crearEspecialidadCatalogo,
    update: svc.editarEspecialidad,
    remove: svc.borrarEspecialidad,
  },
  medico: {
    list: svc.obtenerMedicos,
    create: svc.crearMedicoCatalogo,
    update: svc.editarMedico,
    remove: svc.borrarMedico,
  },
  enfermero: {
    list: svc.obtenerEnfermeros,
    create: svc.crearEnfermeroCatalogo,
    update: svc.editarEnfermeroCatalogo,
    remove: svc.borrarEnfermeroCatalogo,
  },
  farmaceutico: {
    list: svc.obtenerFarmaceuticos,
    create: svc.crearFarmaceuticoCatalogo,
    update: svc.editarFarmaceuticoCatalogo,
    remove: svc.borrarFarmaceuticoCatalogo,
  },
  tecnico: {
    list: svc.obtenerTecnicos,
    create: svc.crearTecnicoCatalogo,
    update: svc.editarTecnicoCatalogo,
    remove: svc.borrarTecnicoCatalogo,
  },
  tipo_seguro: {
    list: svc.obtenerTiposSeguro,
    create: svc.crearTipoSeguroCatalogo,
    update: svc.editarTipoSeguroCatalogo,
    remove: svc.borrarTipoSeguroCatalogo,
  },
};

function idNumeric(req) {
  const raw = req.query?.id ?? req.body?.id;
  if (raw === undefined || raw === null || raw === '') return null;
  const n = Number(raw);
  return Number.isNaN(n) ? null : n;
}

export default async function handler(req, res) {
  const entidad = req.query?.entidad || req.body?.entidad;
  const handler = HANDLERS[entidad];

  if (!handler) {
    return res.status(400).json({ ok: false, mensaje: 'Entidad de catálogo no válida.' });
  }

  try {
    if (req.method === 'GET') {
      const resultado = await handler.list();
      return res.status(resultado.status || 200).json(resultado);
    }

    if (req.method === 'POST') {
      const resultado = await handler.create(req.body || {});
      return res.status(resultado.status || 400).json(resultado);
    }

    if (req.method === 'PUT') {
      const id = idNumeric(req);
      if (!id) return res.status(400).json({ ok: false, mensaje: 'ID requerido.' });
      const resultado = await handler.update(id, req.body || {});
      return res.status(resultado.status || 400).json(resultado);
    }

    if (req.method === 'DELETE') {
      const id = idNumeric(req);
      if (!id) return res.status(400).json({ ok: false, mensaje: 'ID requerido.' });
      const resultado = await handler.remove(id);
      return res.status(resultado.status || 400).json(resultado);
    }

    res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
    return res.status(405).json({ ok: false, mensaje: 'Método no permitido.' });
  } catch (err) {
    console.error(`Error en /api/catalogo (${entidad}):`, err);
    return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
  }
}
