// api/tecnico-laboratorio/analisis/listar.js
import { obtenerAnalisis } from '../../../services/tecnicoLaboratorioService.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ ok: false, mensaje: 'Método no permitido.' });
  }

  try {
    const filtro = {};
    if (req.query?.id_tecnico_laboratorio) filtro.id_tecnico_laboratorio = Number(req.query.id_tecnico_laboratorio);
    if (req.query?.id_paciente) filtro.id_paciente = Number(req.query.id_paciente);
    if (req.query?.id_consulta) filtro.id_consulta = Number(req.query.id_consulta);
    if (req.query?.estado) filtro.estado = req.query.estado;
    if (req.query?.tipo_analisis) filtro.tipo_analisis = req.query.tipo_analisis;

    const resultado = await obtenerAnalisis(filtro);
    return res.status(resultado.status).json(resultado);
  } catch (err) {
    console.error('Error en /api/tecnico-laboratorio/analisis/listar:', err);
    return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
  }
}
