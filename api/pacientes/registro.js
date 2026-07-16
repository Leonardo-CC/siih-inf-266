// api/pacientes/registro.js
// ============================================================
// CAPA DE LÓGICA Y SEGURIDAD (punto de entrada HTTP)
// Función serverless de Vercel: quedará publicada en
//   https://<tu-dominio>.vercel.app/api/pacientes/registro
// Aquí es donde vive (indirectamente) la service role key, vía
// pacienteService -> pacienteRepository -> supabaseAdmin.
// ============================================================
import { registrarPaciente } from '../../services/pacienteService.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ ok: false, mensaje: 'Método no permitido.' });
  }

  try {
    const resultado = await registrarPaciente(req.body);
    return res.status(resultado.status).json(resultado);
  } catch (err) {
    console.error('Error en /api/pacientes/registro:', err);
    return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
  }
}
