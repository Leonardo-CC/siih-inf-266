import { useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Usamos la forma de Vite y la clave ANON (Pública)
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

function App() {
  useEffect(() => {
    async function probarSupabase() {
      const { error } = await supabase.from('tabla_falsa').select('*').limit(1);
      
      if (error && error.code === '42P01') {
        console.log("¡CONEXIÓN EXITOSA DESDE VITE!");
      } else if (error) {
        console.error("ERROR DE CONEXIÓN:", error.message);
      }
    }
    probarSupabase();
  }, []);

  return <div>Revisa la consola de tu navegador (F12) para ver si conectó.</div>;
}

export default App;
