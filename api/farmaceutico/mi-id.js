import { supabaseAdmin } from '../../lib/supabaseAdmin.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ ok: false, mensaje: 'Método no permitido.' });
  }

  try {
    const usuario = req.body?.usuario;
    if (!usuario || !usuario.persona_id) return res.status(401).json({ ok: false, mensaje: 'No autorizado.' });

    const { data, error } = await supabaseAdmin
      .from('farmaceutico')
      .select('id_farmaceutico')
      .eq('persona_id', usuario.persona_id)
      .maybeSingle();

    if (error || !data) return res.status(404).json({ ok: false, mensaje: 'No se encontró el perfil de farmacéutico.' });
    return res.status(200).json({ ok: true, id_farmaceutico: data.id_farmaceutico });
  } catch (err) {
    return res.status(500).json({ ok: false, mensaje: err.message || 'Error en el servidor.' });
  }
}
