// lib/supabaseAdmin.js
// ============================================================
// CAPA DE DATOS
// Cliente de Supabase con la Service Role Key.
// SOLO se importa desde archivos dentro de /api/**.
// Nunca importar esto desde src/ (código que corre en el navegador),
// porque expondría la service role key al cliente.
//
// Nota: si SUPABASE_URL no está definida, cae de vuelta a
// VITE_SUPABASE_URL (misma URL de Supabase, distinto prefijo de env).
// ============================================================
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    'Faltan variables de entorno: SUPABASE_URL (o VITE_SUPABASE_URL) y/o ' +
      'SUPABASE_SERVICE_ROLE_KEY. Revisa tu .env local o las variables del proyecto en Vercel.'
  );
}

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});
