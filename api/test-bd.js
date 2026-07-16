const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // Intentamos leer una tabla que no existe
  const { data, error } = await supabase.from('tabla_falsa').select('*').limit(1);

  if (error) {
    if (error.code === '42P01') {
      // El error bueno: llegaste a la BD pero la tabla no existe
      return res.status(200).json({ 
        mensaje: "✅ ¡CONEXIÓN EXITOSA!", 
        detalle: "Las credenciales funcionan, solo falta crear las tablas en Supabase." 
      });
    } else {
      // Error malo: credenciales incorrectas
      return res.status(500).json({ 
        mensaje: "❌ FALLÓ LA CONEXIÓN", 
        error: error.message 
      });
    }
  }

  // Si por casualidad la tabla existe
  return res.status(200).json({ mensaje: "✅ ÉXITO", data });
}
