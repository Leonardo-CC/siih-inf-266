// src/lib/supabaseClient.js
// ============================================================
// CAPA DE DATOS (lado navegador)
// Cliente de Supabase con la clave anónima. Se usará en próximas
// HUs (login, consulta de historial, etc). HU-01 no lo necesita
// porque el registro se hace vía /api (capa de lógica y seguridad).
// ============================================================
import { createClient } from '@supabase/supabase-js';

export const supabaseClient = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
