// api/tecnico-laboratorio/mi-id.js
import { obtenerIdTecnicoLaboratorioPorPersona } from '../../repositories/tecnicoLaboratorioRepository.js';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ ok: false, mensaje: 'Método no permitido.' });
  }

  try {
    const usuario = req.body?.usuario;
    if (!usuario || !usuario.persona_id) {
      return res.status(401).json({ ok: false, mensaje: 'No autorizado.' });
    }

    const id_tecnico_laboratorio = await obtenerIdTecnicoLaboratorioPorPersona(usuario.persona_id);

    if (!id_tecnico_laboratorio) {
      return res.status(404).json({ ok: false, mensaje: 'No se encontró el perfil de técnico de laboratorio.' });
    }

    return res.status(200).json({ ok: true, id_tecnico_laboratorio });
  } catch (err) {
    console.error('Error en /api/tecnico-laboratorio/mi-id:', err);
    return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
  }
}
