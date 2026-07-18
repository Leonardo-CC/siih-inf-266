// api/pacientes/mi-id.js
import { supabaseAdmin } from '../../lib/supabaseAdmin.js';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ ok: false, mensaje: 'Metodo no permitido.' });
  }

  try {
    const usuario = req.body?.usuario;
    if (!usuario) {
      return res.status(401).json({ ok: false, mensaje: 'No autorizado.' });
    }

    const { data, error } = await supabaseAdmin
      .from('paciente')
      .select('id_paciente')
      .eq('persona_id', usuario.persona_id)
      .maybeSingle();

    if (error || !data) {
      return res.status(404).json({ ok: false, mensaje: 'No se encontro el perfil de paciente.' });
    }

    return res.status(200).json({ ok: true, id_paciente: data.id_paciente });
  } catch (err) {
    console.error('Error en /api/pacientes/mi-id:', err);
    return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
  }
}
