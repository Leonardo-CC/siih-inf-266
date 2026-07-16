import { useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

function App() {
  useEffect(() => {
    async function probarConexion() {
      const { error } = await supabase.from('tabla_falsa').select('*').limit(1);
      
      if (error && error.code === '42P01') {
        console.log("✅ ¡CONEXIÓN EXITOSA DESDE REACT CON VITE!");
      } else if (error) {
        console.error("❌ ERROR DE CONEXIÓN:", error.message);
      }
    }
    probarConexion();
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Proyecto conectado a Supabase</h1>
      <p>Abre la consola de tu navegador (F12) para verificar la conexión.</p>
    </div>
  );
}

export default App;
