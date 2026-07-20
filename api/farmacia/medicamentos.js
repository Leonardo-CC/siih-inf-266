// api/farmacia/medicamentos.js
// ============================================================
// CRUD de medicamentos (rol: farmaceutico).
//   GET    /api/farmacia/medicamentos
//   POST   /api/farmacia/medicamentos
//   PUT    /api/farmacia/medicamentos
//   DELETE /api/farmacia/medicamentos
// ============================================================
import * as svc from '../../services/farmaciaMedicamentosService.js';

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const resultado = await svc.obtenerListaMedicamentos();
      return res.status(resultado.status || 200).json(resultado);
    }

    if (req.method === 'POST') {
      const resultado = await svc.registrarMedicamento(req.body || {});
      return res.status(resultado.status || 201).json(resultado);
    }

    if (req.method === 'PUT') {
      const id = Number(req.query?.id ?? req.body?.id);
      if (!id) return res.status(400).json({ ok: false, mensaje: 'ID de medicamento requerido.' });
      const resultado = await svc.editarMedicamento(id, req.body || {});
      return res.status(resultado.status || 400).json(resultado);
    }

    if (req.method === 'DELETE') {
      const id = Number(req.query?.id ?? req.body?.id);
      if (!id) return res.status(400).json({ ok: false, mensaje: 'ID de medicamento requerido.' });
      const resultado = await svc.borrarMedicamento(id);
      return res.status(resultado.status || 400).json(resultado);
    }

    res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
    return res.status(405).json({ ok: false, mensaje: 'Método no permitido.' });
  } catch (err) {
    console.error('Error en /api/farmacia/medicamentos:', err);
    return res.status(500).json({ 
      ok: false, 
      mensaje: 'Error interno del servidor.', 
      detalle: err.message 
    });
  }
}
