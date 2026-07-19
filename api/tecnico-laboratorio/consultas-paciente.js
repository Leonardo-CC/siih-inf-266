// api/tecnico-laboratorio/consultas-paciente.js
import { obtenerConsultasPaciente } from '../../services/tecnicoLaboratorioService.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ ok: false, mensaje: 'Método no permitido.' });
  }

  try {
    const id_paciente = req.query?.id_paciente ? Number(req.query.id_paciente) : null;
    const resultado = await obtenerConsultasPaciente(id_paciente);
    return res.status(resultado.status).json(resultado);
  } catch (err) {
    console.error('Error en /api/tecnico-laboratorio/consultas-paciente:', err);
    return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
  }
}
